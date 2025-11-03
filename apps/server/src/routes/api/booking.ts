import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../lib/asyncHandler.js';
import { createBooking, listBookingsForUser } from '../../services/bookingService.js';

const bookingSchema = z.object({
  sweetId: z.number().int().positive(),
  date: z.string().min(1),
  timeSlot: z.string().min(1),
  note: z.string().optional(),
});

export const bookingRouter = Router();

bookingRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const booking = await createBooking({
      userId: req.user.id,
      ...parsed.data,
    });

    res.status(201).json({ booking });
  })
);

bookingRouter.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requestedId = Number.parseInt(req.params.userId, 10);
    if (!Number.isFinite(requestedId) || requestedId <= 0) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    if (requestedId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot view other users\' bookings' });
    }

    const bookings = await listBookingsForUser(requestedId);
    res.json({ bookings });
  })
);
