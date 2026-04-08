const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const ETSY_CLIENT_ID = defineSecret("ETSY_CLIENT_ID");
const ETSY_CLIENT_SECRET = defineSecret("ETSY_CLIENT_SECRET");
const DEFAULT_ETSY_SHOP_NAME = "kamlimos";

// ... existing code ...

/**
 * Hash a PIN code securely (server-side only)
 * Callable Function
 * Data: { pin: string }
 * Returns: { hash: string }
 */
exports.hashPin = onCall({ cors: true }, async (request) => {
  try {
    const { pin } = request.data;

    if (!pin || typeof pin !== "string" || pin.length < 4 || pin.length > 8) {
      throw new // Function error handling usually throws specific errors, but simple throw works for now
      Error("Invalid PIN format");
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(pin, saltRounds);

    return { hash };
  } catch (error) {
    console.error("Error hashing PIN:", error);
    throw new Error("Internal server error");
  }
});

/**
 * Compare a PIN with a hash (server-side only)
 * Callable Function
 * Data: { pin: string, hash: string }
 * Returns: { match: boolean }
 */
exports.comparePin = onCall({ cors: true }, async (request) => {
  try {
    const { pin, hash } = request.data;

    if (!pin || !hash || typeof pin !== "string" || typeof hash !== "string") {
      throw new Error("Invalid parameters");
    }

    const match = await bcrypt.compare(pin, hash);
    return { match };
  } catch (error) {
    console.error("Error comparing PIN:", error);
    throw new Error("Internal server error");
  }
});

/**
 * Verify PIN for a gift (convenience function)
 * Callable Function
 * Data: { giftId: string, pin: string }
 * Returns: { match: boolean, giftData: object | null }
 */
/**
 * Setup-Link: Gift per securityToken laden (Kunde öffnet /setup/:id?token=xxx oder /setup/:id/:token)
 * Erlaubt Zugriff auch ohne Auth und unabhängig von Firestore request.query (getDoc hat kein query).
 */
exports.getGiftBySetupToken = onCall(async (request) => {
  const { giftId, token } = request.data;
  if (!giftId || !token) {
    throw new HttpsError("invalid-argument", "giftId and token required");
  }
  const docRef = db.collection("gift_orders").doc(giftId);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Geschenk nicht gefunden.");
  }
  const data = snap.data();
  if (data.securityToken !== token) {
    throw new HttpsError("permission-denied", "Ungültiger Link.");
  }
  return { id: snap.id, ...data };
});

// [NEW] Social Gifting: Secure Lookup by Token
// Contributors need to see Recipient Name/Title but NOT other messages
exports.getGiftByContributionToken = onCall(async (request) => {
  const { token } = request.data;
  if (!token) {
    throw new HttpsError("invalid-argument", "Token required");
  }

  // Find gift with this contributionToken
  const giftsRef = db.collection("gift_orders");
  const q = giftsRef.where("contributionToken", "==", token).limit(1);
  const snapshot = await q.get();

  if (snapshot.empty) {
    throw new HttpsError("not-found", "Geschenk nicht gefunden.");
  }

  const giftDoc = snapshot.docs[0];
  const data = giftDoc.data();

  // Teilbar-Feature: Join-Link nur gültig wenn Geschenk freigegeben (Admin oder Käufer-Opt-in)
  if (data.allowContributions === false) {
    throw new HttpsError(
      "permission-denied",
      "Diese Funktion ist für dieses Geschenk deaktiviert.",
    );
  }

  // Return ONLY public safe metadata (names) + ID (for writing)
  return {
    giftId: giftDoc.id,
    recipientName: data.recipientName || "",
    senderName: data.senderName || "", // "Von [Name]"
    title: data.headline || "", // "Alles Gute..."
    status: data.status,
    locked: data.locked,
    // NO messages, NO images
  };
});

exports.verifyGiftPin = onCall({ cors: true }, async (request) => {
  try {
    // console.log('verifyGiftPin called with data:', request.data); // Clean up logs

    const { giftId, pin } = request.data;

    if (!giftId || giftId === "") {
      console.error("Missing giftId");
      return { match: false, giftData: null };
    }

    if (!pin || pin === "") {
      console.error("Missing pin");
      return { match: false, giftData: null };
    }

    if (typeof pin !== "string") {
      console.error("Invalid pin type:", typeof pin);
      return { match: false, giftData: null };
    }

    // Get gift document
    const giftRef = db.collection("gift_orders").doc(giftId);
    const giftDoc = await giftRef.get();

    if (!giftDoc.exists) {
      return { match: false, giftData: null };
    }

    const giftData = giftDoc.data();
    // Fakten-Log: Was steht in Firestore für dieses Geschenk?
    const messagesInDoc = giftData.messages;
    console.log(
      "[verifyGiftPin] giftId=" +
        giftId +
        " | messages in doc: isArray=" +
        Array.isArray(messagesInDoc) +
        " count=" +
        (Array.isArray(messagesInDoc)
          ? messagesInDoc.length
          : messagesInDoc
            ? "n/a"
            : "undefined"),
    );

    // ============================================
    // TIME CAPSULE CHECK
    // ============================================
    // If unlockDate is set and in the future, DENY access
    if (giftData.unlockDate) {
      // Firestore Timestamp to millis
      const unlockTime = giftData.unlockDate.toMillis
        ? giftData.unlockDate.toMillis()
        : new Date(giftData.unlockDate).getTime();
      const now = Date.now();

      if (now < unlockTime) {
        console.warn(
          `Gift ${giftId} is time-locked until ${new Date(
            unlockTime,
          ).toISOString()}`,
        );
        // Return specific time-locked status so client can show countdown (if they bypassed the lock screen check)
        return {
          match: false,
          giftData: null,
          isTimeLocked: true,
          unlockDate: unlockTime,
        };
      }
    }

    const accessCodeHash = giftData.accessCodeHash;
    const accessCode = giftData.accessCode;

    let match = false;

    // If hash exists, compare with hash
    if (accessCodeHash) {
      match = await bcrypt.compare(pin, accessCodeHash);
    }
    // Fallback: Compare with plain text (backward compatibility)
    else if (accessCode) {
      match = pin === accessCode;
    }

    if (match) {
      // Return full gift data: build plain object so callable response serializes reliably (messages, albumImages)
      const toMillis = (v) =>
        v && typeof v.toMillis === "function"
          ? v.toMillis()
          : v
            ? new Date(v).getTime()
            : undefined;

      const safeGiftData = {
        id: giftDoc.id,
        project: giftData.project,
        productType: giftData.productType,
        headline: giftData.headline,
        subheadline: giftData.subheadline,
        messages: Array.isArray(giftData.messages)
          ? giftData.messages.map((m) => ({ ...m }))
          : [],
        albumImages: Array.isArray(giftData.albumImages)
          ? [...giftData.albumImages]
          : [],
        locked: giftData.locked,
        viewed: giftData.viewed,
        openingAnimation: giftData.openingAnimation,
        unlockDate: giftData.unlockDate
          ? toMillis(giftData.unlockDate)
          : undefined,
        engravingText: giftData.engravingText,
        meaningText: giftData.meaningText,
      };

      // Social Gifting: contributions for viewer
      try {
        const contribsRef = db
          .collection("gift_orders")
          .doc(giftId)
          .collection("contributions");
        const contribsSnapshot = await contribsRef
          .orderBy("timestamp", "asc")
          .get();
        const contributions = contribsSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            content: d.content,
            author: d.author,
            timestamp:
              d.timestamp && typeof d.timestamp.toMillis === "function"
                ? d.timestamp.toMillis()
                : d.timestamp,
          };
        });
        safeGiftData.contributions = contributions;
      } catch (err) {
        console.error("Error fetching contributions in verifyGiftPin:", err);
        safeGiftData.contributions = [];
      }

      console.log(
        "[verifyGiftPin] returning giftData with messages count=" +
          (safeGiftData.messages ? safeGiftData.messages.length : 0),
      );
      return { match: true, giftData: safeGiftData };
    } else {
      // Invalid PIN
      return { match: false, giftData: null };
    }
  } catch (error) {
    console.error("Error verifying gift PIN:", error);
    throw new Error("Internal server error");
  }
});

/**
 * Get public metadata for a locked gift
 * Callable Function
 * Data: { giftId: string }
 * Returns: { exists: boolean, locked: boolean, publicData: object | null }
 */
exports.getPublicGiftData = onCall({ cors: true }, async (request) => {
  try {
    const { giftId } = request.data;

    if (!giftId) {
      return { exists: false };
    }

    const giftRef = db.collection("gift_orders").doc(giftId);
    const giftDoc = await giftRef.get();

    if (!giftDoc.exists) {
      return { exists: false };
    }

    const data = giftDoc.data();
    const isLocked = data.locked === true;

    // Define public fields that resemble the "Lock Screen"
    const publicFields = [
      "project",
      "productType",
      "headline",
      "subheadline",
      "openingAnimation",
      "engravingText", // Needed for bracelet lock screen
      "designImage", // Maybe needed for preview?
      "locked",
      // expiresAt wird unten manuell als expiresAtMillis gesetzt (Callable serialisiert Timestamp)
      // TIME CAPSULE FIELDS
      // 'unlockDate', // Handle manually below to convert to millis
      "timezone", // Just in case we need it for display
    ];

    const publicData = {};
    publicFields.forEach((field) => {
      if (data[field] !== undefined) {
        publicData[field] = data[field];
      }
    });

    // Handle unlockDate separately to convert to millis
    if (data.unlockDate) {
      publicData.unlockDate = data.unlockDate.toMillis
        ? data.unlockDate.toMillis()
        : new Date(data.unlockDate).getTime();
    }

    // Handle expiresAt – zu Millisekunden konvertieren (Callable serialisiert Timestamp sonst anders)
    if (data.expiresAt) {
      publicData.expiresAtMillis = data.expiresAt.toMillis
        ? data.expiresAt.toMillis()
        : new Date(data.expiresAt).getTime();
    }

    // Always include ID
    publicData.id = giftDoc.id;

    return {
      exists: true,
      locked: isLocked,
      publicData: publicData,
    };
  } catch (error) {
    console.error("Error getting public gift data:", error);
    throw new Error("Internal server error");
  }
});

const OAUTH_STATE_TTL_MINUTES = 15;

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createPkcePair() {
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(
    crypto.createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

async function refreshEtsyAccessToken(refreshToken) {
  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  params.set("client_id", ETSY_CLIENT_ID.value());
  params.set("refresh_token", refreshToken);

  const tokenRes = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Etsy token refresh failed: ${tokenRes.status} ${txt}`);
  }

  return tokenRes.json();
}

async function getOrCreateEtsyShopId(accessToken, userId) {
  const integrationRef = db.collection("integrations").doc("etsy");
  const snap = await integrationRef.get();
  const existingShopId = snap.exists ? snap.data()?.shopId : null;
  if (existingShopId) return existingShopId;
  const shopName =
    (snap.exists ? snap.data()?.shopName : null) || DEFAULT_ETSY_SHOP_NAME;

  // Primary: resolve via authenticated user -> shops
  const res = await fetch(
    `https://api.etsy.com/v3/application/users/${userId}/shops`,
    {
      headers: {
        "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Could not resolve Etsy shopId: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const first = data?.results?.[0];
  let shopId = first?.shop_id;

  // Fallback: resolve by known shop name
  if (!shopId && shopName) {
    const byNameRes = await fetch(
      `https://api.etsy.com/v3/application/shops?shop_name=${encodeURIComponent(shopName)}`,
      {
        headers: {
          "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (byNameRes.ok) {
      const byName = await byNameRes.json();
      shopId =
        byName?.results?.[0]?.shop_id ||
        byName?.shop_id ||
        byName?.shopId ||
        null;
    }
  }

  if (!shopId) {
    throw new Error(
      "No Etsy shop found for authenticated user. Please confirm shop owner account or set shopName/shopId in integrations/etsy.",
    );
  }

  await integrationRef.set(
    {
      shopId,
      shopName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return shopId;
}

function readMoney(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (typeof val === "object") {
    if (
      typeof val.amount === "number" &&
      typeof val.divisor === "number" &&
      val.divisor > 0
    ) {
      return val.amount / val.divisor;
    }
    if (val.amount != null) return parseFloat(val.amount) || 0;
  }
  return 0;
}

function toDateKey(ts) {
  const d = ts ? new Date(ts * 1000) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return {
    daily: `${yyyy}-${mm}-${dd}`,
    monthly: `${yyyy}-${mm}`,
    yearly: `${yyyy}`,
  };
}

async function findOrCreateCustomer(buyerEmail, buyerName, address) {
  const custCol = db.collection("etsy_customers");
  const key = (buyerEmail || "").trim().toLowerCase();

  if (key) {
    const existing = await custCol.where("email", "==", key).limit(1).get();
    if (!existing.empty) {
      const custDoc = existing.docs[0];
      const custData = custDoc.data();
      const addresses = Array.isArray(custData.addresses)
        ? custData.addresses
        : [];
      const addrStr = JSON.stringify(address);
      const alreadyHas = addresses.some((a) => JSON.stringify(a) === addrStr);
      await custDoc.ref.set(
        {
          name: buyerName || custData.name || "",
          lastOrderAt: admin.firestore.FieldValue.serverTimestamp(),
          totalOrders: admin.firestore.FieldValue.increment(0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(!alreadyHas && address?.firstLine
            ? { addresses: [...addresses, address] }
            : {}),
        },
        { merge: true },
      );
      return custDoc.id;
    }
  }

  const newDoc = await custCol.add({
    name: buyerName || "",
    email: key || "",
    addresses: address?.firstLine ? [address] : [],
    platforms: { etsy: {} },
    firstOrderAt: admin.firestore.FieldValue.serverTimestamp(),
    lastOrderAt: admin.firestore.FieldValue.serverTimestamp(),
    totalOrders: 0,
    totalRevenue: 0,
    tags: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return newDoc.id;
}

async function updateSummaries(orderDate, amounts, delta = 1) {
  const keys = toDateKey(orderDate);
  const types = [
    { key: keys.daily, type: "daily" },
    { key: keys.monthly, type: "monthly" },
    { key: keys.yearly, type: "yearly" },
  ];

  for (const { key, type } of types) {
    const ref = db.collection("etsy_summaries").doc(key);
    await ref.set(
      {
        type,
        periodKey: key,
        totalOrders: admin.firestore.FieldValue.increment(delta),
        grossRevenue: admin.firestore.FieldValue.increment(amounts.gross || 0),
        totalShipping: admin.firestore.FieldValue.increment(
          amounts.shipping || 0,
        ),
        totalFees: admin.firestore.FieldValue.increment(amounts.totalFees || 0),
        totalPlatformFees: admin.firestore.FieldValue.increment(
          amounts.platformFee || 0,
        ),
        totalProcessingFees: admin.firestore.FieldValue.increment(
          amounts.processingFee || 0,
        ),
        totalPayout: admin.firestore.FieldValue.increment(amounts.payout || 0),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}

async function syncEtsyOrdersInternal() {
  const integrationRef = db.collection("integrations").doc("etsy");
  const integrationSnap = await integrationRef.get();
  if (!integrationSnap.exists) {
    throw new Error("Etsy integration not connected yet. Run OAuth first.");
  }

  const integration = integrationSnap.data();
  if (!integration?.refreshToken) {
    throw new Error("Missing Etsy refresh token. Reconnect Etsy OAuth.");
  }

  const refreshed = await refreshEtsyAccessToken(integration.refreshToken);
  const accessToken = refreshed.access_token;
  const refreshToken = refreshed.refresh_token || integration.refreshToken;
  const tokenPrefix = String(accessToken || "").split(".")[0];
  const userId =
    tokenPrefix && /^\d+$/.test(tokenPrefix)
      ? Number(tokenPrefix)
      : integration.userId;
  const shopId = await getOrCreateEtsyShopId(accessToken, userId);

  const receiptsUrl = `https://api.etsy.com/v3/application/shops/${shopId}/receipts?limit=100&sort_on=created&sort_order=desc`;
  const receiptsRes = await fetch(receiptsUrl, {
    headers: {
      "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!receiptsRes.ok) {
    const txt = await receiptsRes.text();
    throw new Error(`Etsy receipts fetch failed: ${receiptsRes.status} ${txt}`);
  }

  const receiptsData = await receiptsRes.json();
  const receipts = Array.isArray(receiptsData?.results)
    ? receiptsData.results
    : [];
  console.log("Etsy sync: fetched receipts", {
    count: receipts.length,
    shopId,
  });
  const apiHeaders = {
    "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
    Authorization: `Bearer ${accessToken}`,
  };

  let allPayments = [];
  try {
    const paymentsUrl = `https://api.etsy.com/v3/application/shops/${shopId}/payments?limit=100`;
    const paymentsRes = await fetch(paymentsUrl, { headers: apiHeaders });
    if (paymentsRes.ok) {
      const paymentsData = await paymentsRes.json();
      allPayments = Array.isArray(paymentsData?.results) ? paymentsData.results : [];
      console.log("Etsy sync: fetched payments", { count: allPayments.length });
    } else {
      console.warn("Etsy payments fetch failed (non-critical):", paymentsRes.status);
    }
  } catch (payErr) {
    console.warn("Etsy payments fetch error (non-critical):", payErr.message);
  }

  const paymentsByReceipt = {};
  for (const p of allPayments) {
    const rid = String(p?.receipt_id || "");
    if (!rid) continue;
    if (!paymentsByReceipt[rid]) paymentsByReceipt[rid] = [];
    paymentsByReceipt[rid].push(p);
  }

  let upserted = 0;
  let newOrders = 0;

  for (const r of receipts) {
    const platformOrderId = String(r?.receipt_id || "");
    if (!platformOrderId) continue;

    const gross = readMoney(r?.grandtotal || r?.total_price || r?.grand_total || r?.subtotal);
    const shipping = readMoney(r?.total_shipping_cost || r?.shipping_cost);

    let platformFee = 0;
    let processingFee = 0;
    const receiptPayments = paymentsByReceipt[platformOrderId] || [];
    if (receiptPayments.length > 0) {
      for (const pay of receiptPayments) {
        platformFee += readMoney(pay?.amount_fees || pay?.seller_fees || pay?.fee);
        processingFee += readMoney(pay?.processing_fees || pay?.payment_fee);
      }
    }

    if (platformFee === 0 && processingFee === 0 && gross > 0) {
      platformFee = Number((gross * 0.065 + 0.20).toFixed(2));
      processingFee = Number((gross * 0.04 + 0.30).toFixed(2));
    }

    const totalFees = Number((platformFee + processingFee).toFixed(2));
    const payout = Number((gross + shipping - totalFees).toFixed(2));

    const buyerName = r?.name || r?.buyer_name || "";
    const buyerEmail = (r?.buyer_email || r?.email || "").trim().toLowerCase();
    const personalization = r?.message_from_buyer || r?.gift_message || r?.note_to_seller || r?.buyer_note || "";
    const shippingAddress = {
      name: r?.name || "",
      firstLine: r?.first_line || r?.address1 || "",
      secondLine: r?.second_line || r?.address2 || "",
      zip: r?.zip || r?.postal_code || "",
      city: r?.city || r?.town || "",
      state: r?.state || "",
      countryIso: r?.country_iso || r?.country_code || "",
    };

    const isDelivered = r?.is_delivered === true;
    const isShipped = r?.was_shipped === true || !!r?.shipped_date;
    const status = isDelivered ? "delivered" : isShipped ? "shipped" : "processing";

    const items = Array.isArray(r?.transactions)
      ? r.transactions.map((t) => ({
          title: t?.title || "",
          quantity: t?.quantity || 1,
          price: readMoney(t?.price),
          sku: t?.sku || "",
        }))
      : [];

    const orderTimestamp = r?.create_timestamp || r?.created_timestamp || null;
    const orderDate = orderTimestamp
      ? admin.firestore.Timestamp.fromMillis(orderTimestamp * 1000)
      : admin.firestore.FieldValue.serverTimestamp();

    const amounts = {
      gross: Number(gross.toFixed(2)),
      net: Number((gross / 1.19).toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      platformFee: Number(platformFee.toFixed(2)),
      processingFee: Number(processingFee.toFixed(2)),
      totalFees,
      payout,
    };

    const customerId = await findOrCreateCustomer(
      buyerEmail,
      buyerName,
      shippingAddress,
    );

    const existing = await db
      .collection("etsy_orders")
      .where("platformOrderId", "==", platformOrderId)
      .limit(1)
      .get();

    const orderPayload = {
      platform: "etsy",
      platformOrderId,
      customerId,
      customerName: buyerName,
      customerEmail: buyerEmail,
      status,
      items,
      amounts,
      costs: existing.empty ? 0 : undefined,
      profit: 0,
      businessType: existing.empty ? "mini" : undefined,
      shippingAddress,
      personalization,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    Object.keys(orderPayload).forEach(
      (k) => orderPayload[k] === undefined && delete orderPayload[k],
    );

    if (!existing.empty) {
      const existingDoc = existing.docs[0];
      const existingData = existingDoc.data();
      const costs = existingData.costs || 0;
      const bt = existingData.businessType || "mini";
      const finanzamt =
        bt === "standard"
          ? Number((amounts.gross * 0.19 + amounts.gross * 0.2).toFixed(2))
          : 0;
      const profit = Number((amounts.payout - costs - finanzamt).toFixed(2));
      orderPayload.profit = profit;
      await existingDoc.ref.set(orderPayload, { merge: true });
      upserted += 1;
    } else {
      const profit = Number(amounts.payout.toFixed(2));
      await db.collection("etsy_orders").add({
        ...orderPayload,
        costs: 0,
        profit,
        businessType: "mini",
        orderDate,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      upserted += 1;
      newOrders += 1;

      await db
        .collection("etsy_customers")
        .doc(customerId)
        .set(
          {
            totalOrders: admin.firestore.FieldValue.increment(1),
            totalRevenue: admin.firestore.FieldValue.increment(amounts.gross),
            lastOrderAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      await updateSummaries(orderTimestamp, amounts, 1);
    }
  }

  await integrationRef.set(
    {
      refreshToken,
      userId,
      shopId,
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log("Etsy sync complete", {
    fetched: receipts.length,
    upserted,
    newOrders,
    shopId,
    userId,
  });
  return { fetched: receipts.length, upserted, newOrders };
}

/**
 * OAuth start endpoint - redirects to Etsy consent screen.
 * Register this as Redirect URI base companion:
 * https://europe-west1-gift-shop-app-7bbd3.cloudfunctions.net/etsyOAuthCallback
 */
exports.etsyOAuthStart = onRequest(
  { region: "europe-west1", secrets: [ETSY_CLIENT_ID, ETSY_CLIENT_SECRET] },
  async (req, res) => {
    try {
      const redirectUri =
        "https://europe-west1-gift-shop-app-7bbd3.cloudfunctions.net/etsyOAuthCallback";
      const state = base64Url(crypto.randomBytes(32));
      const { verifier, challenge } = createPkcePair();

      await db
        .collection("integrations")
        .doc("etsy_oauth_states")
        .collection("pending")
        .doc(state)
        .set({
          verifier,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      const scope = encodeURIComponent("shops_r transactions_r");
      const oauthUrl =
        `https://www.etsy.com/oauth/connect?response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&client_id=${encodeURIComponent(ETSY_CLIENT_ID.value())}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=S256`;

      res.redirect(oauthUrl);
    } catch (error) {
      console.error("etsyOAuthStart failed", error);
      res.status(500).send("Could not start Etsy OAuth.");
    }
  },
);

/**
 * OAuth callback endpoint - exchanges code for tokens and stores refresh token.
 */
exports.etsyOAuthCallback = onRequest(
  { region: "europe-west1", secrets: [ETSY_CLIENT_ID, ETSY_CLIENT_SECRET] },
  async (req, res) => {
    try {
      const code = req.query.code;
      const state = req.query.state;
      if (!code || !state) {
        res.status(400).send("Missing code/state.");
        return;
      }

      const pendingRef = db
        .collection("integrations")
        .doc("etsy_oauth_states")
        .collection("pending")
        .doc(String(state));
      const pendingSnap = await pendingRef.get();
      if (!pendingSnap.exists) {
        res.status(400).send("Invalid or expired OAuth state.");
        return;
      }

      const createdAt = pendingSnap.data()?.createdAt;
      if (createdAt?.toMillis) {
        const ageMin = (Date.now() - createdAt.toMillis()) / (1000 * 60);
        if (ageMin > OAUTH_STATE_TTL_MINUTES) {
          await pendingRef.delete();
          res.status(400).send("OAuth state expired. Please restart.");
          return;
        }
      }

      const verifier = pendingSnap.data()?.verifier;
      const redirectUri =
        "https://europe-west1-gift-shop-app-7bbd3.cloudfunctions.net/etsyOAuthCallback";

      const params = new URLSearchParams();
      params.set("grant_type", "authorization_code");
      params.set("client_id", ETSY_CLIENT_ID.value());
      params.set("redirect_uri", redirectUri);
      params.set("code", String(code));
      params.set("code_verifier", verifier);

      const tokenRes = await fetch(
        "https://api.etsy.com/v3/public/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Etsy token exchange failed:", tokenJson);
        res.status(400).send("Token exchange failed.");
        return;
      }

      const accessToken = tokenJson.access_token;
      const refreshToken = tokenJson.refresh_token;
      const tokenPrefix = String(accessToken || "").split(".")[0];
      const userId =
        tokenPrefix && /^\d+$/.test(tokenPrefix) ? Number(tokenPrefix) : null;

      await db
        .collection("integrations")
        .doc("etsy")
        .set(
          {
            provider: "etsy",
            connected: true,
            userId,
            refreshToken,
            tokenType: tokenJson.token_type || "Bearer",
            accessTokenLast4: accessToken ? accessToken.slice(-4) : null,
            scopes: ["shops_r", "transactions_r"],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            connectedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      await pendingRef.delete();
      let firstSync = { fetched: 0, upserted: 0 };
      try {
        firstSync = await syncEtsyOrdersInternal();
      } catch (syncErr) {
        console.error("Initial Etsy sync after OAuth failed:", syncErr);
      }
      console.log("Etsy OAuth connected", { userId, firstSync });
      res.redirect(
        `https://admin.kamlimos.com/admin/taxes?etsy=connected&fetched=${encodeURIComponent(
          String(firstSync.fetched || 0),
        )}&upserted=${encodeURIComponent(String(firstSync.upserted || 0))}`,
      );
    } catch (error) {
      console.error("etsyOAuthCallback failed", error);
      res.status(500).send("OAuth callback error.");
    }
  },
);

/**
 * Manual sync callable for admins.
 */
exports.etsySyncOrdersNow = onCall(
  { region: "europe-west1", secrets: [ETSY_CLIENT_ID, ETSY_CLIENT_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Admin login required.");
    }
    try {
      return await syncEtsyOrdersInternal();
    } catch (error) {
      console.error("etsySyncOrdersNow failed", error);
      const message = error?.message || "Etsy sync failed";
      if (
        message.includes("Missing Etsy refresh token") ||
        message.includes("No Etsy shop found") ||
        message.includes("Etsy receipts fetch failed")
      ) {
        throw new HttpsError("failed-precondition", message);
      }
      throw new HttpsError("internal", message);
    }
  },
);

/**
 * Debug helper: returns raw Etsy receipt field diagnostics.
 * Admin-only callable to inspect what Etsy actually sends.
 */
exports.etsyDebugReceipts = onCall(
  { region: "europe-west1", secrets: [ETSY_CLIENT_ID, ETSY_CLIENT_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Admin login required.");
    }

    const limit = Math.min(Math.max(Number(request.data?.limit || 3), 1), 10);
    const integrationSnap = await db
      .collection("integrations")
      .doc("etsy")
      .get();
    if (!integrationSnap.exists || !integrationSnap.data()?.refreshToken) {
      throw new HttpsError(
        "failed-precondition",
        "Etsy not connected (missing refresh token).",
      );
    }
    const integration = integrationSnap.data();
    const refreshed = await refreshEtsyAccessToken(integration.refreshToken);
    const accessToken = refreshed.access_token;
    const tokenPrefix = String(accessToken || "").split(".")[0];
    const userId =
      tokenPrefix && /^\d+$/.test(tokenPrefix)
        ? Number(tokenPrefix)
        : integration.userId;
    const shopId = await getOrCreateEtsyShopId(accessToken, userId);

    const receiptsUrl = `https://api.etsy.com/v3/application/shops/${shopId}/receipts?limit=${limit}&sort_on=created&sort_order=desc`;
    const receiptsRes = await fetch(receiptsUrl, {
      headers: {
        "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!receiptsRes.ok) {
      const txt = await receiptsRes.text();
      throw new HttpsError(
        "internal",
        `Etsy receipts fetch failed: ${receiptsRes.status} ${txt}`,
      );
    }

    const receiptsData = await receiptsRes.json();
    const receipts = Array.isArray(receiptsData?.results)
      ? receiptsData.results
      : [];

    let debugPayments = [];
    try {
      const payUrl = `https://api.etsy.com/v3/application/shops/${shopId}/payments?limit=25`;
      const payRes = await fetch(payUrl, {
        headers: {
          "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        debugPayments = Array.isArray(payData?.results) ? payData.results : [];
      }
    } catch (e) { /* non-critical */ }

    const payByReceipt = {};
    for (const p of debugPayments) {
      const rid = String(p?.receipt_id || "");
      if (rid) payByReceipt[rid] = p;
    }

    const diagnostics = receipts.map((r) => {
      const rid = String(r?.receipt_id || "");
      const pay = payByReceipt[rid] || null;
      return {
        receipt_id: rid,
        receipt_keys: Object.keys(r || {}),
        receipt_money: {
          grandtotal: r?.grandtotal ?? null,
          subtotal: r?.subtotal ?? null,
          total_price: r?.total_price ?? null,
          total_shipping_cost: r?.total_shipping_cost ?? null,
          total_tax_cost: r?.total_tax_cost ?? null,
          total_vat_cost: r?.total_vat_cost ?? null,
          discount_amt: r?.discount_amt ?? null,
        },
        payment_found: !!pay,
        payment_keys: pay ? Object.keys(pay) : [],
        payment_fees: pay ? {
          amount_gross: pay?.amount_gross ?? null,
          amount_fees: pay?.amount_fees ?? null,
          amount_net: pay?.amount_net ?? null,
          seller_fees: pay?.seller_fees ?? null,
          processing_fees: pay?.processing_fees ?? null,
          payment_fee: pay?.payment_fee ?? null,
          fee: pay?.fee ?? null,
          posted_gross: pay?.posted_gross ?? null,
          posted_fee: pay?.posted_fee ?? null,
          posted_net: pay?.posted_net ?? null,
          adjusted_gross: pay?.adjusted_gross ?? null,
          adjusted_fees: pay?.adjusted_fees ?? null,
          adjusted_net: pay?.adjusted_net ?? null,
        } : null,
        transactions_count: Array.isArray(r?.transactions) ? r.transactions.length : 0,
      };
    });

    return {
      shopId,
      fetched: receipts.length,
      diagnostics,
    };
  },
);

/**
 * Scheduled sync every 30 minutes.
 */
exports.etsySyncOrdersScheduled = onSchedule(
  {
    region: "europe-west1",
    schedule: "every 30 minutes",
    timeZone: "Europe/Berlin",
    secrets: [ETSY_CLIENT_ID, ETSY_CLIENT_SECRET],
  },
  async () => {
    try {
      const result = await syncEtsyOrdersInternal();
      console.log("etsySyncOrdersScheduled success", result);
    } catch (error) {
      console.error("etsySyncOrdersScheduled failed", error);
    }
  },
);
