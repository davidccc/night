import { prisma } from '../src/index.js';
async function main() {
    await prisma.rewardLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.sweet.deleteMany();
    await prisma.user.deleteMany();
    const users = await prisma.user.createMany({
        data: [
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
        skipDuplicates: true,
    });
    console.log(`Seeded users: ${users.count}`);
    const sweets = await prisma.sweet.createMany({
        data: [
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
        skipDuplicates: true,
    });
    console.log(`Seeded sweets: ${sweets.count}`);
}
main()
    .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
