/// <reference types="bun-types" />
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'net';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { JWT_SECRET } from '../src/middleware/auth.js';

const databaseUrl = process.env.DATABASE_URL;

const createTestClient = (): PrismaClient => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

const generateToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

describe('UTR history integration', () => {
  if (!databaseUrl) {
    it('skips without DATABASE_URL', () => {
      expect(true).toBe(true);
    });
    return;
  }

  let prisma: PrismaClient;
  let server: { stop: () => void; port: number } | null = null;
  let userId = 0;
  let authCookie = '';

  beforeAll(async () => {
    prisma = createTestClient();

    const user = await prisma.user.create({
      data: {
        email: `test-utr-${Date.now()}@example.com`,
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    userId = user.id;
    authCookie = `access_token=${generateToken(userId, user.email)}`;

    const { default: app } = await import('../src/app.js');
    const listener = app.listen(0);
    const address = listener.address() as AddressInfo;
    server = {
      stop: () => listener.close(),
      port: address.port,
    };
  });

  afterAll(async () => {
    if (prisma && userId) {
      await prisma.utrHistory.deleteMany({ where: { userId } });
      await prisma.userPreferences.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
    if (server) server.stop();
  });

  const request = async (path: string, options: RequestInit = {}) => {
    if (!server) throw new Error('Server not started');
    const url = `http://localhost:${server.port}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Cookie: authCookie,
      },
    });
    return response;
  };

  it('creates history on preferences update and dedupes same rating', async () => {
    const first = await request('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({
        primaryHand: 'right',
        playStyle: 'All-court',
        backhandType: 'two-handed',
        utrRating: 7.1,
        utrProfileUrl: 'https://app.universaltennis.com/profiles/test',
      }),
    });
    expect(first.status).toBe(200);

    const second = await request('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({
        primaryHand: 'right',
        playStyle: 'All-court',
        backhandType: 'two-handed',
        utrRating: 7.1,
        utrProfileUrl: 'https://app.universaltennis.com/profiles/test',
      }),
    });
    expect(second.status).toBe(200);

    const third = await request('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({
        primaryHand: 'right',
        playStyle: 'All-court',
        backhandType: 'two-handed',
        utrRating: 7.4,
        utrProfileUrl: 'https://app.universaltennis.com/profiles/test',
      }),
    });
    expect(third.status).toBe(200);

    const history = await request('/api/utr/history');
    const historyJson = await history.json() as { items: Array<{ rating: number }> };
    expect(history.status).toBe(200);
    expect(historyJson.items.length).toBe(2);
    expect(historyJson.items.map((item: { rating: number }) => item.rating)).toEqual([7.1, 7.4]);
  });
});
