import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get all matches for user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
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
    const [items, total] = await prisma.$transaction([
      prisma.tennisMatch.findMany({
        where: { userId },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tennisMatch.count({ where: { userId } })
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Get single match
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }
  
  try {
    const match = await prisma.tennisMatch.findFirst({
      where: { 
        id,
        userId 
      }
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

// Create match
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const {
    opponentName,
    opponentUtr,
    matchDate,
    location,
    surface,
    userSetsWon,
    opponentSetsWon,
    matchScore,
    result,
    notes
  } = req.body;

  if (!opponentName || !matchDate) {
    res.status(400).json({ error: 'Opponent name and match date are required' });
    return;
  }

  try {
    const match = await prisma.tennisMatch.create({
      data: {
        userId,
        opponentName,
        opponentUtr,
        matchDate: new Date(matchDate),
        location,
        surface,
        userSetsWon,
        opponentSetsWon,
        matchScore,
        result,
        notes
      }
    });

    res.status(201).json({
      message: 'Match created successfully',
      id: match.id
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Update match
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }
  
  const {
    opponentName,
    opponentUtr,
    matchDate,
    location,
    surface,
    userSetsWon,
    opponentSetsWon,
    matchScore,
    result,
    notes
  } = req.body;

  try {
    const match = await prisma.tennisMatch.updateMany({
      where: { 
        id,
        userId 
      },
      data: {
        opponentName,
        opponentUtr,
        matchDate: matchDate ? new Date(matchDate) : undefined,
        location,
        surface,
        userSetsWon,
        opponentSetsWon,
        matchScore,
        result,
        notes
      }
    });

    if (match.count === 0) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({ message: 'Match updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Delete match
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }
  
  try {
    const match = await prisma.tennisMatch.deleteMany({
      where: { 
        id,
        userId 
      }
    });

    if (match.count === 0) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
