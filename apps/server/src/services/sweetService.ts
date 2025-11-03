import { prisma } from '../lib/prisma.js';

export function listSweets() {
  return prisma.sweet.findMany({
    orderBy: { id: 'asc' },
  });
}
