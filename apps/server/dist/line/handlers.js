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
export async function handleLineEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }
    const messageEvent = event;
    const text = messageEvent.message.text.trim();
    const builder = keywordMap[text];
    let reply = buildDefaultMessage();
    if (builder) {
        reply = await builder();
    }
    if (Array.isArray(reply)) {
        await lineClient.replyMessage(messageEvent.replyToken, reply);
    }
    else {
        await lineClient.replyMessage(messageEvent.replyToken, [reply]);
    }
}
