import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get all matches for user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  
  try {
    const matches = await prisma.tennisMatch.findMany({
      where: { userId },
      orderBy: { matchDate: 'desc' }
    });
    res.json(matches);
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