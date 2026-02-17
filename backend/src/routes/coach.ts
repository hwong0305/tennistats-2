import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getCurrentUser = async (req: AuthenticatedRequest) => {
  const userId = req.user?.userId;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
};

const ensureCoachAccess = async (coachId: number, studentId: number): Promise<boolean> => {
  const invite = await prisma.coachInvite.findFirst({
    where: {
      coachId,
      studentId,
      status: 'accepted',
    },
  });
  return !!invite;
};

// Student: create coach invite
router.post('/invites', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'student') {
    res.status(403).json({ error: 'Only students can invite coaches' });
    return;
  }

  const { coachEmail } = req.body as { coachEmail?: string };
  if (!coachEmail) {
    res.status(400).json({ error: 'Coach email is required' });
    return;
  }

  const normalizedEmail = normalizeEmail(coachEmail);
  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }
  if (normalizedEmail === currentUser.email) {
    res.status(400).json({ error: 'You cannot invite yourself' });
    return;
  }

  try {
    const coachUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (coachUser && coachUser.role !== 'coach') {
      res.status(400).json({ error: 'That user is not registered as a coach' });
      return;
    }

    const invite = await prisma.coachInvite.create({
      data: {
        studentId: currentUser.id,
        coachId: coachUser?.id || null,
        coachEmail: normalizedEmail,
        status: 'pending',
      },
    });

    res.status(201).json({ invite });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unique constraint')) {
      res.status(400).json({ error: 'Invite already exists for that coach' });
      return;
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Student: list invites
router.get('/invites', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'student') {
    res.status(403).json({ error: 'Only students can view their invites' });
    return;
  }

  try {
    const invites = await prisma.coachInvite.findMany({
      where: { studentId: currentUser.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: {
        coach: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    res.json({ invites });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Coach: list pending invites
router.get('/invites/pending', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view pending invites' });
    return;
  }

  try {
    const invites = await prisma.coachInvite.findMany({
      where: {
        coachEmail: currentUser.email,
        status: 'pending',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        student: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    res.json({ invites });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/invites/:id/accept', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can accept invites' });
    return;
  }

  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid invite ID' });
    return;
  }

  try {
    const invite = await prisma.coachInvite.findFirst({
      where: { id, coachEmail: currentUser.email },
    });
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    if (invite.status !== 'pending') {
      res.status(400).json({ error: 'Invite is no longer pending' });
      return;
    }

    const updated = await prisma.coachInvite.update({
      where: { id },
      data: { status: 'accepted', coachId: currentUser.id },
    });
    res.json({ invite: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/invites/:id/decline', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can decline invites' });
    return;
  }

  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid invite ID' });
    return;
  }

  try {
    const invite = await prisma.coachInvite.findFirst({
      where: { id, coachEmail: currentUser.email },
    });
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    if (invite.status !== 'pending') {
      res.status(400).json({ error: 'Invite is no longer pending' });
      return;
    }

    const updated = await prisma.coachInvite.update({
      where: { id },
      data: { status: 'declined', coachId: currentUser.id },
    });
    res.json({ invite: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Coach: list accepted students
router.get('/students', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view students' });
    return;
  }

  try {
    const invites = await prisma.coachInvite.findMany({
      where: { coachId: currentUser.id, status: 'accepted' },
      include: { student: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const students = invites.map(invite => invite.student);
    res.json({ students });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Coach: student profile with comments
router.get('/students/:studentId/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view student profiles' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  if (Number.isNaN(studentId)) {
    res.status(400).json({ error: 'Invalid student ID' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const [student, preferences, comments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.userPreferences.findUnique({ where: { userId: studentId } }),
      prisma.profileComment.findMany({
        where: { studentId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
    ]);

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json({ student, preferences, comments });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/students/:studentId/profile/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can comment on profiles' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  if (Number.isNaN(studentId)) {
    res.status(400).json({ error: 'Invalid student ID' });
    return;
  }

  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const comment = await prisma.profileComment.create({
      data: {
        studentId,
        coachId: currentUser.id,
        content: content.trim(),
      },
    });
    res.status(201).json({ comment });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Coach: journal list
router.get('/students/:studentId/journals', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view journals' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  if (Number.isNaN(studentId)) {
    res.status(400).json({ error: 'Invalid student ID' });
    return;
  }

  const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
  const pageSizeRaw = Number.parseInt(req.query.pageSize as string, 10) || 6;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
  const sort = (req.query.sort as string) || 'date-desc';
  const allowedSorts = new Set(['date-desc', 'date-asc', 'title-asc', 'title-desc']);
  if (!allowedSorts.has(sort)) {
    res.status(400).json({ error: 'Invalid sort parameter' });
    return;
  }

  const orderBy = (() => {
    switch (sort) {
      case 'date-asc':
        return [{ entryDate: 'asc' as const }, { id: 'asc' as const }];
      case 'title-asc':
        return [{ title: 'asc' as const }, { entryDate: 'desc' as const }];
      case 'title-desc':
        return [{ title: 'desc' as const }, { entryDate: 'desc' as const }];
      case 'date-desc':
      default:
        return [{ entryDate: 'desc' as const }, { id: 'desc' as const }];
    }
  })();

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const [items, total] = await prisma.$transaction([
      prisma.journalEntry.findMany({
        where: { userId: studentId },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          comments: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
      }),
      prisma.journalEntry.count({ where: { userId: studentId } }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/students/:studentId/journals/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view journal entries' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(studentId) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: studentId },
      include: {
        comments: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }
    res.json(entry);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/students/:studentId/journals/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can comment on journal entries' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(studentId) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const entry = await prisma.journalEntry.findFirst({ where: { id, userId: studentId } });
    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    const comment = await prisma.journalComment.create({
      data: {
        journalEntryId: id,
        studentId,
        coachId: currentUser.id,
        content: content.trim(),
      },
    });
    res.status(201).json({ comment });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Coach: matches list
router.get('/students/:studentId/matches', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view matches' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  if (Number.isNaN(studentId)) {
    res.status(400).json({ error: 'Invalid student ID' });
    return;
  }

  const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
  const pageSizeRaw = Number.parseInt(req.query.pageSize as string, 10) || 8;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
  const sort = (req.query.sort as string) || 'date-desc';
  const allowedSorts = new Set(['date-desc', 'date-asc', 'opponent-asc', 'opponent-desc']);
  if (!allowedSorts.has(sort)) {
    res.status(400).json({ error: 'Invalid sort parameter' });
    return;
  }

  const orderBy = (() => {
    switch (sort) {
      case 'date-asc':
        return [{ matchDate: 'asc' as const }, { id: 'asc' as const }];
      case 'opponent-asc':
        return [{ opponentName: 'asc' as const }, { matchDate: 'desc' as const }];
      case 'opponent-desc':
        return [{ opponentName: 'desc' as const }, { matchDate: 'desc' as const }];
      case 'date-desc':
      default:
        return [{ matchDate: 'desc' as const }, { id: 'desc' as const }];
    }
  })();

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const [items, total] = await prisma.$transaction([
      prisma.tennisMatch.findMany({
        where: { userId: studentId },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          comments: {
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
      }),
      prisma.tennisMatch.count({ where: { userId: studentId } }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/students/:studentId/matches/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can view matches' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(studentId) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const match = await prisma.tennisMatch.findFirst({
      where: { id, userId: studentId },
      include: {
        comments: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: { coach: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(match);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/students/:studentId/matches/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (currentUser.role !== 'coach') {
    res.status(403).json({ error: 'Only coaches can comment on matches' });
    return;
  }

  const studentId = Number.parseInt(req.params.studentId as string, 10);
  const id = Number.parseInt(req.params.id as string, 10);
  if (Number.isNaN(studentId) || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  try {
    const access = await ensureCoachAccess(currentUser.id, studentId);
    if (!access) {
      res.status(403).json({ error: 'Access not granted for this student' });
      return;
    }

    const match = await prisma.tennisMatch.findFirst({ where: { id, userId: studentId } });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const comment = await prisma.matchComment.create({
      data: {
        matchId: id,
        studentId,
        coachId: currentUser.id,
        content: content.trim(),
      },
    });
    res.status(201).json({ comment });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
