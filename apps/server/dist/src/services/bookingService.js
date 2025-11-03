import { prisma } from '../lib/prisma.js';
export function listBookingsForUser(userId) {
    return prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            sweet: true,
        },
    });
}
export async function createBooking(input) {
    const bookingDate = new Date(input.date);
    if (Number.isNaN(bookingDate.getTime())) {
        throw Object.assign(new Error('Invalid booking date'), { status: 400 });
    }
    return prisma.$transaction(async (tx) => {
        const sweet = await tx.sweet.findUnique({ where: { id: input.sweetId } });
        if (!sweet) {
            throw Object.assign(new Error('Sweet not found'), { status: 404 });
        }
        const booking = await tx.booking.create({
            data: {
                userId: input.userId,
                sweetId: input.sweetId,
                date: bookingDate,
                timeSlot: input.timeSlot,
                status: 'PENDING',
                note: input.note,
            },
            include: {
                sweet: true,
            },
        });
        await tx.user.update({
            where: { id: input.userId },
            data: {
                rewardPoints: { increment: 50 },
            },
        });
        await tx.rewardLog.create({
            data: {
                userId: input.userId,
                delta: 50,
                reason: `預約 ${sweet.name}`,
            },
        });
        return booking;
    });
}
