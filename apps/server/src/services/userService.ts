import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@night-king/prisma';

export interface LineProfile {
  lineUserId: string;
  displayName?: string | null;
  avatar?: string | null;
}

export function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export function getUserByLineId(lineUserId: string) {
  return prisma.user.findUnique({ where: { lineUserId } });
}

export async function upsertLineUser(profile: LineProfile) {
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

export async function adjustRewardPoints(userId: number, delta: number, reason: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
