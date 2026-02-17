import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get user preferences
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });
    res.json(preferences || null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Create or update user preferences
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const { primaryHand, playStyle, backhandType, utrRating, utrProfileUrl } = req.body;

  try {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        primaryHand,
        playStyle,
        backhandType,
        utrRating,
        utrProfileUrl
      },
      create: {
        userId,
        primaryHand,
        playStyle,
        backhandType,
        utrRating,
        utrProfileUrl
      }
    });

    const parsedRating = typeof utrRating === 'number' ? utrRating : null;
    if (parsedRating !== null) {
      const latest = await prisma.utrHistory.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        select: { rating: true }
      });

      if (!latest || latest.rating !== parsedRating) {
        await prisma.utrHistory.create({
          data: {
            userId,
            rating: parsedRating,
          }
        });
      }
    }

    res.json({ 
      message: preferences ? 'Preferences updated successfully' : 'Preferences created successfully',
      preferences 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
