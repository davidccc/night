import type { Message, MessageEvent, WebhookEvent } from '@line/bot-sdk';

import { listSweets } from '../services/sweetService.js';
import { buildCustomerServiceMessage, buildDefaultMessage, buildRulesMessage, buildSweetCarousel } from './messages.js';
import { lineClient } from './client.js';

const keywordMap: Record<string, () => Promise<Message | Message[]>> = {
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

function isTextMessageEvent(event: WebhookEvent): event is MessageEvent & { message: { type: 'text'; text: string } } {
  return event.type === 'message' && event.message.type === 'text';
}

export async function handleLineEvent(event: WebhookEvent) {
  if (!isTextMessageEvent(event)) {
    return;
  }

  const text = event.message.text.trim();
  const builder = keywordMap[text];

  let reply: Message | Message[] = buildDefaultMessage();

  if (builder) {
    reply = await builder();
  }

  if (Array.isArray(reply)) {
    await lineClient.replyMessage(event.replyToken, reply);
  } else {
    await lineClient.replyMessage(event.replyToken, [reply]);
  }
}
