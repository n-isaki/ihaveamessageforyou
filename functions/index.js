const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.shopifyOrderCreate = onRequest({ cors: true }, async (req, res) => {
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
        // Convert properties (sometimes object, sometimes array in raw JSON?)
        // Shopify webhook usually sends array of objects: [{name: "_giftId", value: "..."}]

        // Safety check if properties is object (rare edge case in some API versions)
        let propsArray = Array.isArray(properties) ? properties : [];
        if (!Array.isArray(properties) && typeof properties === 'object') {
            propsArray = Object.keys(properties).map(key => ({ name: key, value: properties[key] }));
        }

        const giftIdProp = propsArray.find(p => p.name === '_giftId');

        if (giftIdProp && giftIdProp.value) {
            const giftId = giftIdProp.value;
            console.log(`Found Linked Gift: ${giftId}`);

            const giftRef = db.collection('gift_orders').doc(giftId);

            batch.update(giftRef, {
                status: 'paid', // Mark as paid/linked
                orderId: order.name,
                shopifyOrderId: String(order.id),
                shopifyOrderNumber: String(order.order_number), // plain number e.g. 1001
                orderName: order.name, // e.g. #1001
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
