import { sequelize, RewardLog, User } from '../db/index.js';
export async function getRewardSummary(userId) {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'rewardPoints'],
    });
    if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
    }
    const logs = await RewardLog.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
    });
    return { ...user.get(), logs };
}
export async function setRewardPoints(userId, rewardPoints, reason) {
    return sequelize.transaction(async (transaction) => {
        const existing = await User.findByPk(userId, { transaction });
        if (!existing) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }
        const delta = rewardPoints - existing.rewardPoints;
        existing.rewardPoints = rewardPoints;
        await existing.save({ transaction });
        await existing.reload({ transaction });
        if (delta !== 0) {
            await RewardLog.create({
                userId,
                delta,
                reason,
            }, { transaction });
        }
        return { user: existing, delta };
    });
}
