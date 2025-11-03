import { sequelize, Booking, RewardLog, Sweet, User } from '../db/index.js';
export function listBookingsForUser(userId) {
    return Booking.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Sweet,
                as: 'sweet',
            },
        ],
    });
}
export async function createBooking(input) {
    const bookingDate = new Date(input.date);
    if (Number.isNaN(bookingDate.getTime())) {
        throw Object.assign(new Error('Invalid booking date'), { status: 400 });
    }
    return sequelize.transaction(async (transaction) => {
        const sweet = await Sweet.findByPk(input.sweetId, { transaction });
        if (!sweet) {
            throw Object.assign(new Error('Sweet not found'), { status: 404 });
        }
        const user = await User.findByPk(input.userId, { transaction });
        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404 });
        }
        const booking = await Booking.create({
            userId: input.userId,
            sweetId: input.sweetId,
            date: bookingDate,
            timeSlot: input.timeSlot,
            status: 'PENDING',
            note: input.note ?? null,
        }, { transaction });
        await booking.reload({
            transaction,
            include: [{ model: Sweet, as: 'sweet' }],
        });
        await user.increment('rewardPoints', { by: 50, transaction });
        await user.reload({ transaction });
        await RewardLog.create({
            userId: input.userId,
            delta: 50,
            reason: `預約 ${sweet.name}`,
        }, { transaction });
        return booking;
    });
}
