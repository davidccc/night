import { prisma } from '../lib/prisma.js';
export async function getRewardSummary(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, rewardPoints: true },
    });
    if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
    }
    const logs = await prisma.rewardLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    return { ...user, logs };
}
export async function setRewardPoints(userId, rewardPoints, reason) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { id: userId } });
        if (!existing) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }
        const delta = rewardPoints - existing.rewardPoints;
        const user = await tx.user.update({
            where: { id: userId },
            data: { rewardPoints },
        });
        if (delta !== 0) {
            await tx.rewardLog.create({
                data: {
                    userId,
                    delta,
                    reason,
                },
            });
        }
        return { user, delta };
    });
}
