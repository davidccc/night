import { closeDatabase, initDatabase, RewardLog, Sweet, User } from '../src/db/index.js';

async function main() {
  try {
    await initDatabase();

    await RewardLog.truncate({ cascade: true });
    await Sweet.truncate({ cascade: true });
    await User.truncate({ cascade: true });

    const users = await User.bulkCreate(
      [
        {
          lineUserId: 'U123',
          displayName: '小夜',
          avatar: 'https://placekitten.com/200/200',
          rewardPoints: 150,
        },
        {
          lineUserId: 'U456',
          displayName: '夜貓',
          avatar: 'https://placekitten.com/200/201',
          rewardPoints: 40,
        },
      ],
      { returning: true }
    );

    console.log(`Seeded users: ${users.length}`);

    const sweets = await Sweet.bulkCreate(
      [
        {
          name: '蜜桃甜心',
          description: '柔順粉桃系陪伴，暖心又貼心。',
          imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
          tag: '桃粉',
        },
        {
          name: '焦糖甜心',
          description: '陽光系甜心，隨時準備好陪你聊天。',
          imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187',
          tag: '活力',
        },
      ],
      { returning: true }
    );

    console.log(`Seeded sweets: ${sweets.length}`);
  } finally {
    await closeDatabase().catch((error) => {
      console.error('Failed to close database connection', error);
    });
  }
}

main().catch((error) => {
  console.error('Database seed failed', error);
  process.exit(1);
});
