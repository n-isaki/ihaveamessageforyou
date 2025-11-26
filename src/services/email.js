import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendNotificationEmail = async (giftData) => {
    try {
        const templateParams = {
            customer_name: giftData.customerName,
            customer_email: giftData.customerEmail,
            recipient_name: giftData.recipientName,
            gift_link: `${window.location.origin}/gift/${giftData.id}`
        };

        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );

        console.log('SUCCESS!', response.status, response.text);
        return response;
    } catch (error) {
        console.error('FAILED...', error);
        // We don't want to block the user flow if email fails, just log it
        return null;
    }
};
