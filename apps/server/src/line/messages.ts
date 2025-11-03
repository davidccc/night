import type { FlexBubble, FlexComponent, FlexMessage, Message } from '@line/bot-sdk';

import type { Sweet } from '../db/index.js';
import { getEnv } from '../config/env.js';

const env = getEnv();

export function buildDefaultMessage(): Message {
  return {
    type: 'text',
    text: '嗨，我是小夜的助理，歡迎你！可輸入「甜心列表」、「預約規則」或「客服」來開始互動唷。',
  };
}

export function buildRulesMessage(): Message {
  const lines = [
    '📜 小夜陪伴服務規則',
    '1) 請保持禮貌與尊重，禁止不當語言。',
    '2) 預約需提前 1 天提出，臨時取消請告知。',
    '3) 如需真人客服，輸入「客服」即可為你安排。',
  ];

  return {
    type: 'text',
    text: lines.join('\n'),
  };
}

export function buildCustomerServiceMessage(): Message {
  const lines = [
    '👩‍💼 已轉接至真人客服，請稍候。',
    '若客服忙碌，可先留言你的需求與聯絡方式。',
  ];

  return {
    type: 'text',
    text: lines.join('\n'),
  };
}

export function buildSweetCarousel(sweets: Sweet[]): FlexMessage {
  const contents: FlexBubble[] = sweets.map((sweet) => ({
    type: 'bubble' as const,
    hero: {
      type: 'image',
      url: resolveImage(sweet.imageUrl),
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: buildBodyContents(sweet.name, sweet.description, sweet.tag),
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'message',
            label: '預約',
            text: `我想預約 ${sweet.name}`,
          },
          style: 'primary',
          color: '#FF5A8C',
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '了解更多',
            uri: env.LIFF_BASE_URL ? `${env.LIFF_BASE_URL}/sweet?id=${sweet.id}` : 'https://liff.line.me',
          },
          style: 'secondary',
        },
      ],
    },
  }));

  return {
    type: 'flex',
    altText: '甜心甜點列表',
    contents: {
      type: 'carousel',
      contents,
    },
  };
}

function resolveImage(imageUrl?: string | null) {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';
  }
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  if (env.BASE_URL) {
    return new URL(imageUrl, env.BASE_URL).toString();
  }
  return imageUrl;
}

function buildBodyContents(name: string, description: string, tag?: string | null): FlexComponent[] {
  const contents: FlexComponent[] = [
    {
      type: 'text',
      text: name,
      weight: 'bold',
      size: 'lg',
    },
    {
      type: 'text',
      text: description,
      wrap: true,
      margin: 'md',
      size: 'sm',
      color: '#555555',
    },
  ];

  if (tag) {
    contents.push({
      type: 'box',
      layout: 'baseline',
      margin: 'sm',
      contents: [
        {
          type: 'icon',
          size: 'sm',
          url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png',
        },
        {
          type: 'text',
          text: tag,
          size: 'sm',
          color: '#FF5A8C',
          margin: 'xs',
        },
      ],
    });
  }

  return contents;
}
