import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';

const COOKIE_NAME = 'access_token';
const TOKEN_EXPIRES_IN = '24h';
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (password: string): boolean => password.length >= 8;

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  });
};

const router = Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const normalizedRole = role?.toLowerCase();
  const allowedRoles = new Set(['student', 'coach']);
  if (normalizedRole && !allowedRoles.has(normalizedRole)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: normalizedRole === 'coach' ? 'coach' : 'student'
      }
    });

    if (user.role === 'coach') {
      await prisma.coachInvite.updateMany({
        where: {
          coachEmail: user.email,
          coachId: null,
        },
        data: {
          coachId: user.id,
        }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    setAuthCookie(res, token);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out' });
});

export default router;
