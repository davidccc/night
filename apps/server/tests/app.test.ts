import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/lineAuthService.js', () => ({
  loginWithLine: vi.fn(),
}));

vi.mock('../src/services/userService.js', () => ({
  getUserById: vi.fn(),
  upsertLineUser: vi.fn(),
}));

vi.mock('../src/services/sweetService.js', () => ({
  listSweets: vi.fn(),
}));

const { loginWithLine } = await import('../src/services/lineAuthService.js');
const { getUserById } = await import('../src/services/userService.js');
const { listSweets } = await import('../src/services/sweetService.js');
const { createApp } = await import('../src/app.js');

const userFixture = {
  id: 1,
  lineUserId: 'U123',
  displayName: 'Tester',
  avatar: null,
  rewardPoints: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Night-king API', () => {
  beforeEach(() => {
    vi.mocked(getUserById).mockResolvedValue(userFixture as never);
  });

  it('logs in via POST /api/login', async () => {
    vi.mocked(loginWithLine).mockResolvedValue({
      user: userFixture,
      token: 'signed-token',
    });

    const app = createApp();
    const response = await request(app)
      .post('/api/login')
      .send({ idToken: 'mock-token' })
      .expect(200);

    expect(response.body.token).toBe('signed-token');
  });

  it('blocks sweets listing without auth', async () => {
    const app = createApp();
    await request(app).get('/api/sweets').expect(401);
  });

  it('returns sweets list for authenticated user', async () => {
    vi.mocked(listSweets).mockResolvedValue([
      { id: 1, name: 'Test Sweet', description: 'desc', imageUrl: null, tag: null, createdAt: new Date(), updatedAt: new Date() },
    ] as never);

    const app = createApp();
    const token = jwt.sign({ userId: userFixture.id }, process.env.JWT_SECRET!, { expiresIn: '10m' });

    const response = await request(app)
      .get('/api/sweets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.sweets).toHaveLength(1);
  });
});
