import { listSweets } from '../services/sweetService.js';
import { buildCustomerServiceMessage, buildDefaultMessage, buildRulesMessage, buildSweetCarousel } from './messages.js';
import { lineClient } from './client.js';
const keywordMap = {
    甜心列表: async () => {
        const sweets = await listSweets();
        if (!sweets.length) {
            return {
                type: 'text',
                text: '目前沒有上架的甜心，請稍後再試或聯絡客服唷。',
            };
        }
        return buildSweetCarousel(sweets);
    },
    預約規則: async () => buildRulesMessage(),
    客服: async () => buildCustomerServiceMessage(),
};
function isTextMessageEvent(event) {
    return event.type === 'message' && event.message.type === 'text';
}
export async function handleLineEvent(event) {
    if (!isTextMessageEvent(event)) {
        return;
    }
    const text = event.message.text.trim();
    const builder = keywordMap[text];
    let reply = buildDefaultMessage();
    if (builder) {
        reply = await builder();
    }
    if (Array.isArray(reply)) {
        await lineClient.replyMessage(event.replyToken, reply);
    }
    else {
        await lineClient.replyMessage(event.replyToken, [reply]);
    }
}
