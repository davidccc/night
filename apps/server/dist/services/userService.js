import { prisma } from '../lib/prisma.js';
export function getUserById(id) {
    return prisma.user.findUnique({ where: { id } });
}
export function getUserByLineId(lineUserId) {
    return prisma.user.findUnique({ where: { lineUserId } });
}
export async function upsertLineUser(profile) {
    return prisma.user.upsert({
        where: { lineUserId: profile.lineUserId },
        update: {
            displayName: profile.displayName ?? undefined,
            avatar: profile.avatar ?? undefined,
        },
        create: {
            lineUserId: profile.lineUserId,
            displayName: profile.displayName ?? '小夜用戶',
            avatar: profile.avatar ?? undefined,
        },
    });
}
export async function adjustRewardPoints(userId, delta, reason) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                rewardPoints: { increment: delta },
            },
        });
        await tx.rewardLog.create({
            data: {
                userId,
                delta,
                reason,
            },
        });
        return user;
    });
}
