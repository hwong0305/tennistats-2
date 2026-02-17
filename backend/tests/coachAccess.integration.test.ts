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

const generateToken = (userId: number, email: string, role: 'student' | 'coach'): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Coach access integration', () => {
  if (!databaseUrl) {
    it('skips without DATABASE_URL', () => {
      expect(true).toBe(true);
    });
    return;
  }

  let prisma: PrismaClient;
  let server: { stop: () => void; port: number } | null = null;
  let studentId = 0;
  let coachId = 0;
  let coachEmail = '';
  let studentCookie = '';
  let coachCookie = '';

  beforeAll(async () => {
    prisma = createTestClient();

    const stamp = Date.now();
    const student = await prisma.user.create({
      data: {
        email: `test-student-${stamp}@example.com`,
        password: 'hashed',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
      },
    });
    const coach = await prisma.user.create({
      data: {
        email: `test-coach-${stamp}@example.com`,
        password: 'hashed',
        firstName: 'Test',
        lastName: 'Coach',
        role: 'coach',
      },
    });

    studentId = student.id;
    coachId = coach.id;
    coachEmail = coach.email;
    studentCookie = `access_token=${generateToken(studentId, student.email, 'student')}`;
    coachCookie = `access_token=${generateToken(coachId, coach.email, 'coach')}`;

    const { default: app } = await import('../src/app.js');
    const listener = app.listen(0);
    const address = listener.address() as AddressInfo;
    server = {
      stop: () => listener.close(),
      port: address.port,
    };
  });

  afterAll(async () => {
    if (prisma) {
      if (studentId) {
        await prisma.profileComment.deleteMany({ where: { studentId } });
        await prisma.coachInvite.deleteMany({ where: { studentId } });
        await prisma.user.deleteMany({ where: { id: studentId } });
      }
      if (coachId) {
        await prisma.profileComment.deleteMany({ where: { coachId } });
        await prisma.coachInvite.deleteMany({ where: { coachId } });
        await prisma.user.deleteMany({ where: { id: coachId } });
      }
      await prisma.$disconnect();
    }
    if (server) server.stop();
  });

  const request = async (path: string, cookie: string, options: RequestInit = {}) => {
    if (!server) throw new Error('Server not started');
    const url = `http://localhost:${server.port}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Cookie: cookie,
      },
    });
    return response;
  };

  it('lets a student invite a coach and grants access on accept', async () => {
    const inviteResponse = await request('/api/coach/invites', studentCookie, {
      method: 'POST',
      body: JSON.stringify({ coachEmail }),
    });
    expect(inviteResponse.status).toBe(201);

    const pendingResponse = await request('/api/coach/invites/pending', coachCookie);
    expect(pendingResponse.status).toBe(200);
    const pendingJson = await pendingResponse.json() as { invites: Array<{ id: number }> };
    expect(pendingJson.invites.length).toBe(1);

    const inviteId = pendingJson.invites[0].id;
    const acceptResponse = await request(`/api/coach/invites/${inviteId}/accept`, coachCookie, {
      method: 'POST',
    });
    expect(acceptResponse.status).toBe(200);

    const studentsResponse = await request('/api/coach/students', coachCookie);
    expect(studentsResponse.status).toBe(200);
    const studentsJson = await studentsResponse.json() as { students: Array<{ id: number }> };
    expect(studentsJson.students.some(student => student.id === studentId)).toBe(true);

    const profileResponse = await request(`/api/coach/students/${studentId}/profile`, coachCookie);
    expect(profileResponse.status).toBe(200);

    const commentResponse = await request(`/api/coach/students/${studentId}/profile/comments`, coachCookie, {
      method: 'POST',
      body: JSON.stringify({ content: 'Great progress so far.' }),
    });
    expect(commentResponse.status).toBe(201);
  });
});
