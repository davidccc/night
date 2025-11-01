const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');
const fs = require('fs/promises');
const { URL } = require('url');

require('dotenv').config();

const {
  CHANNEL_ACCESS_TOKEN: channelAccessToken,
  CHANNEL_SECRET: channelSecret,
  PORT = 3000,
  BASE_URL: baseUrl,
} = process.env;

if (!channelAccessToken || !channelSecret) {
  throw new Error(
    'LINE credentials are missing. Set CHANNEL_ACCESS_TOKEN and CHANNEL_SECRET in your environment.'
  );
}

const lineConfig = {
  channelAccessToken,
  channelSecret,
};

const client = new line.Client(lineConfig);
const app = express();

const publicDir = path.join(__dirname, '..', 'public');
const imageDir = path.join(publicDir, 'images');

app.use('/images', express.static(imageDir));

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '小夜 LINE Chatbot webhook is running',
    baseUrl,
  });
});

app.get('/webhook', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Use POST requests from LINE Messaging API to deliver events.',
  });
});

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  const events = req.body.events || [];
  if (!Array.isArray(events)) {
    console.error('Invalid webhook payload:', req.body);
    return res.status(400).end();
  }

  console.log(
    `Received ${events.length} event(s):`,
    events.map((event) => event.type).join(', ')
  );

  const results = await Promise.all(events.map(handleEvent));
  res.json(results);
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    console.log('Skipping unsupported event', event.type);
    return Promise.resolve(null);
  }

  const text = String(event.message.text || '').trim();

  try {
    switch (text) {
      case '甜心列表':
        return await replySweetList(event.replyToken);
      case '預約規則':
        return await replyRules(event.replyToken);
      case '客服':
        return await replyCustomerService(event.replyToken);
      default:
        return await client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: '嗨，我是小夜的助理，請輸入「甜心列表」、「預約規則」或「客服」來開始互動！',
          },
        ]);
    }
  } catch (err) {
    console.error('Failed to handle event', err);
    // Swallow the error so LINE still receives a 200 OK without showing fallback text.
    return Promise.resolve();
  }
}

const sweetFilePath = path.join(__dirname, '..', 'flex', 'sweet.json');
let sweetCache = null;

async function loadSweetList() {
  try {
    if (!sweetCache) {
      const file = await fs.readFile(sweetFilePath, 'utf8');
      const data = JSON.parse(file);
      if (!Array.isArray(data)) {
        throw new Error('sweet.json should contain an array.');
      }
      sweetCache = data;
    }
    return sweetCache;
  } catch (err) {
    console.error('Failed to load sweet list:', err);
    throw err;
  }
}

fs.watch(sweetFilePath, { persistent: false }, () => {
  sweetCache = null;
  console.log('sweet.json updated, cache cleared.');
});

async function replySweetList(replyToken) {
  const sweets = await loadSweetList();
  if (!sweets.length) {
    return client.replyMessage(replyToken, {
      type: 'text',
      text: '目前沒有可顯示的甜心，請稍後再試！',
    });
  }
  const flex = buildSweetFlexCarousel(sweets);

  return client.replyMessage(replyToken, {
    type: 'flex',
    altText: '甜心列表',
    contents: flex,
  });
}

function buildSweetFlexCarousel(sweets) {
  const contents = sweets.map((item) => ({
    type: 'bubble',
    hero: {
      type: 'image',
      url: resolveImageUrl(item.image),
      size: 'full',
      aspectRatio: '1.51:1',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: item.link,
      },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: item.name,
          weight: 'bold',
          size: 'xl',
        },
        {
          type: 'text',
          text: item.desc,
          wrap: true,
          margin: 'md',
          size: 'sm',
          color: '#555555',
        },
      ],
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
            label: '聊聊',
            text: `我想找${item.name}`,
          },
          height: 'sm',
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '更多資訊',
            uri: item.link,
          },
          height: 'sm',
          style: 'secondary',
        },
      ],
    },
  }));

  return {
    type: 'carousel',
    contents,
  };
}

function resolveImageUrl(imagePath) {
  if (!imagePath) {
    return 'https://picsum.photos/600?blur=3';
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  let normalized = imagePath.trim();

  if (!normalized.startsWith('/')) {
    normalized = normalized.startsWith('images/')
      ? `/${normalized}`
      : `/images/${normalized}`;
  }

  if (!baseUrl) {
    console.warn(
      `BASE_URL is not configured. Returning relative image path: ${normalized}`
    );
    return normalized;
  }

  try {
    return new URL(normalized, baseUrl).toString();
  } catch (err) {
    console.error('Failed to resolve image URL', { imagePath, err });
    return normalized;
  }
}

function replyRules(replyToken) {
  const text = [
    '📜 使用規則（小夜）',
    '1) 本服務提供聊天/陪聊/生活建議，請保持禮貌與尊重。',
    '2) 嚴禁任何違法/不當內容要求。',
    '3) 若需人工協助，請輸入「客服」。',
  ].join('\n');

  return client.replyMessage(replyToken, {
    type: 'text',
    text,
  });
}

function replyCustomerService(replyToken) {
  const text = [
    '👩‍💼 已為你安排客服協助，請稍候。',
    '也可先留言你的問題與聯絡方式。',
  ].join('\n');

  return client.replyMessage(replyToken, {
    type: 'text',
    text,
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`小夜 LINE Chatbot server listening on port ${PORT}`);
});
