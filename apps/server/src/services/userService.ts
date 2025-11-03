import { sequelize, RewardLog, User } from '../db/index.js';
import type { Transaction } from 'sequelize';

export interface LineProfile {
  lineUserId: string;
  displayName?: string | null;
  avatar?: string | null;
}

export function getUserById(id: number) {
  return User.findByPk(id);
}

export function getUserByLineId(lineUserId: string) {
  return User.findOne({ where: { lineUserId } });
}

export async function upsertLineUser(profile: LineProfile) {
  const existing = await User.findOne({ where: { lineUserId: profile.lineUserId } });
  if (existing) {
    existing.displayName = profile.displayName ?? existing.displayName ?? '小夜用戶';
    existing.avatar = profile.avatar ?? existing.avatar ?? null;
    await existing.save();
    return existing;
  }

  return User.create({
    lineUserId: profile.lineUserId,
    displayName: profile.displayName ?? '小夜用戶',
    avatar: profile.avatar ?? null,
  });
}

export async function adjustRewardPoints(userId: number, delta: number, reason: string) {
  return sequelize.transaction(async (transaction: Transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    await user.increment('rewardPoints', { by: delta, transaction });
    await RewardLog.create({ userId, delta, reason }, { transaction });
    await user.reload({ transaction });
    return user;
  });
}
