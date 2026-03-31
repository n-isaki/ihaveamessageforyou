const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const ETSY_CLIENT_ID = defineSecret("ETSY_CLIENT_ID");
const ETSY_CLIENT_SECRET = defineSecret("ETSY_CLIENT_SECRET");

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
      "Diese Funktion ist für dieses Geschenk deaktiviert."
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
    console.log("[verifyGiftPin] giftId=" + giftId + " | messages in doc: isArray=" + Array.isArray(messagesInDoc) + " count=" + (Array.isArray(messagesInDoc) ? messagesInDoc.length : (messagesInDoc ? "n/a" : "undefined")));

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
            unlockTime
          ).toISOString()}`
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
        v && typeof v.toMillis === "function" ? v.toMillis() : (v ? new Date(v).getTime() : undefined);

      const safeGiftData = {
        id: giftDoc.id,
        project: giftData.project,
        productType: giftData.productType,
        headline: giftData.headline,
        subheadline: giftData.subheadline,
        messages: Array.isArray(giftData.messages) ? giftData.messages.map((m) => ({ ...m })) : [],
        albumImages: Array.isArray(giftData.albumImages) ? [...giftData.albumImages] : [],
        locked: giftData.locked,
        viewed: giftData.viewed,
        openingAnimation: giftData.openingAnimation,
        unlockDate: giftData.unlockDate ? toMillis(giftData.unlockDate) : undefined,
        engravingText: giftData.engravingText,
        meaningText: giftData.meaningText,
      };

      // Social Gifting: contributions for viewer
      try {
        const contribsRef = db.collection("gift_orders").doc(giftId).collection("contributions");
        const contribsSnapshot = await contribsRef.orderBy("timestamp", "asc").get();
        const contributions = contribsSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            content: d.content,
            author: d.author,
            timestamp: d.timestamp && typeof d.timestamp.toMillis === "function" ? d.timestamp.toMillis() : d.timestamp,
          };
        });
        safeGiftData.contributions = contributions;
      } catch (err) {
        console.error("Error fetching contributions in verifyGiftPin:", err);
        safeGiftData.contributions = [];
      }

      console.log("[verifyGiftPin] returning giftData with messages count=" + (safeGiftData.messages ? safeGiftData.messages.length : 0));
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
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
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

  const res = await fetch(`https://api.etsy.com/v3/application/users/${userId}/shops`, {
    headers: {
      "x-api-key": `${ETSY_CLIENT_ID.value()}:${ETSY_CLIENT_SECRET.value()}`,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Could not resolve Etsy shopId: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const first = data?.results?.[0];
  const shopId = first?.shop_id;
  if (!shopId) {
    throw new Error("No Etsy shop found for authenticated user.");
  }

  await integrationRef.set(
    {
      shopId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return shopId;
}

function readReceiptMoney(receipt) {
  const candidate =
    receipt?.grandtotal ||
    receipt?.total_price ||
    receipt?.total ||
    receipt?.grand_total ||
    null;

  if (candidate == null) return 0;
  if (typeof candidate === "number") return candidate;
  if (typeof candidate === "string") return parseFloat(candidate) || 0;

  if (typeof candidate === "object") {
    if (typeof candidate.amount === "number" && typeof candidate.divisor === "number" && candidate.divisor > 0) {
      return candidate.amount / candidate.divisor;
    }
    if (typeof candidate.amount === "string") {
      return parseFloat(candidate.amount) || 0;
    }
  }
  return 0;
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
  const userId = tokenPrefix && /^\d+$/.test(tokenPrefix) ? Number(tokenPrefix) : integration.userId;

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
  const receipts = Array.isArray(receiptsData?.results) ? receiptsData.results : [];
  console.log("Etsy sync: fetched receipts", { count: receipts.length, shopId });
  let upserted = 0;

  for (const r of receipts) {
    const etsyOrderId = String(r?.receipt_id || r?.receiptId || "");
    if (!etsyOrderId) continue;

    const sellingPrice = readReceiptMoney(r);
    const buyerName = r?.name || r?.buyer_name || "";
    const buyerEmail = r?.buyer_email || r?.email || "";
    const personalizationText =
      r?.message_from_buyer ||
      r?.gift_message ||
      r?.message_from_seller ||
      r?.note_to_seller ||
      r?.buyer_note ||
      "";
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
    const shippingStatus = isDelivered ? "delivered" : isShipped ? "shipped" : "processing";

    const q = await db
      .collection("gift_orders")
      .where("etsyOrderId", "==", etsyOrderId)
      .limit(1)
      .get();

    const basePayload = {
      platform: "etsy",
      etsyOrderId,
      customerName: buyerName,
      customerEmail: buyerEmail,
      personalizationText,
      shippingAddress,
      shippingStatus,
      taxInfo: {
        sellingPrice: Number(sellingPrice.toFixed(2)),
        costs: 0,
        businessType: "mini",
        platform: "etsy",
        platformFee: 0,
        finanzamt: 0,
        profit: 0,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!q.empty) {
      await q.docs[0].ref.set(basePayload, { merge: true });
      upserted += 1;
      continue;
    }

    await db.collection("gift_orders").add({
      ...basePayload,
      status: "open",
      locked: true,
      viewed: false,
      setupStarted: false,
      project: "etsy",
      productType: "etsy-order",
      securityToken: crypto.randomUUID(),
      contributionToken: crypto.randomUUID(),
      allowContributions: false,
      isPublic: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    upserted += 1;
  }

  await integrationRef.set(
    {
      refreshToken,
      userId,
      shopId,
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("Etsy sync complete", { fetched: receipts.length, upserted, shopId, userId });
  return { fetched: receipts.length, upserted };
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

      await db.collection("integrations").doc("etsy_oauth_states").collection("pending").doc(state).set({
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
  }
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

      const tokenRes = await fetch("https://api.etsy.com/v3/public/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Etsy token exchange failed:", tokenJson);
        res.status(400).send("Token exchange failed.");
        return;
      }

      const accessToken = tokenJson.access_token;
      const refreshToken = tokenJson.refresh_token;
      const tokenPrefix = String(accessToken || "").split(".")[0];
      const userId = tokenPrefix && /^\d+$/.test(tokenPrefix) ? Number(tokenPrefix) : null;

      await db.collection("integrations").doc("etsy").set(
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
        { merge: true }
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
          String(firstSync.fetched || 0)
        )}&upserted=${encodeURIComponent(String(firstSync.upserted || 0))}`
      );
    } catch (error) {
      console.error("etsyOAuthCallback failed", error);
      res.status(500).send("OAuth callback error.");
    }
  }
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
  }
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
  }
);
