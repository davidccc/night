import { sequelize, RewardLog, User } from '../db/index.js';
export function getUserById(id) {
    return User.findByPk(id);
}
export function getUserByLineId(lineUserId) {
    return User.findOne({ where: { lineUserId } });
}
export async function upsertLineUser(profile) {
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
export async function adjustRewardPoints(userId, delta, reason) {
    return sequelize.transaction(async (transaction) => {
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
