const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// HMAC Verification für Shopify Webhooks
function verifyShopifyWebhook(req) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error("SHOPIFY_WEBHOOK_SECRET not set!");
    return false;
  }
  
  if (!hmac) {
    console.error("No HMAC header found");
    return false;
  }
  
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
}

exports.shopifyOrderCreate = onRequest({ cors: true }, async (req, res) => {
  // Security: HMAC Verification
  if (!verifyShopifyWebhook(req)) {
    console.error("Invalid HMAC signature");
    res.status(401).send("Unauthorized");
    return;
  }
  
  const order = req.body;
  console.log("Webhook Received. Order ID:", order.id, "Number:", order.name);

  if (!order.line_items) {
    res.status(200).send("No line items");
    return;
  }

  const batch = db.batch();
  let updatesCount = 0;

  for (const item of order.line_items) {
    // Check properties for _giftId
    const properties = item.properties || [];
    
    // Safety check if properties is object
    let propsArray = Array.isArray(properties) ? properties : [];
    if (!Array.isArray(properties) && typeof properties === 'object') {
      propsArray = Object.keys(properties).map(key => ({ name: key, value: properties[key] }));
    }

    const giftIdProp = propsArray.find(p => p.name === '_giftId');

    if (giftIdProp && giftIdProp.value) {
      const giftId = giftIdProp.value;
      
      // Security: Validate giftId format (should be Firestore document ID)
      if (typeof giftId !== 'string' || giftId.length > 50) {
        console.error(`Invalid giftId format: ${giftId}`);
        continue;
      }
      
      console.log(`Found Linked Gift: ${giftId}`);

      const giftRef = db.collection('gift_orders').doc(giftId);
      
      // Security: Check if document exists before updating
      const giftDoc = await giftRef.get();
      if (!giftDoc.exists) {
        console.error(`Gift ${giftId} does not exist`);
        continue;
      }

      batch.update(giftRef, {
        status: 'paid',
        orderId: order.name,
        productVariant: item.variant_title || '',
        shopifyOrderId: String(order.id),
        shopifyOrderNumber: String(order.order_number),
        orderName: order.name,
        customerName: getCustomerName(order),
        customerEmail: order.email || (order.customer && order.customer.email),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updatesCount++;
    }
  }

  if (updatesCount > 0) {
    await batch.commit();
    console.log(`Updated ${updatesCount} gifts.`);
  }

  res.status(200).send(`Processed. Updated ${updatesCount} gifts.`);
});

function getCustomerName(order) {
  if (order.customer) {
    return `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim();
  }
  if (order.shipping_address) {
    return `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim();
  }
  return 'Unbekannt';
}
