import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get UTR info for current user
router.get('/my-utr', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { utrRating: true, utrProfileUrl: true }
    });
    
    if (!preferences || !preferences.utrProfileUrl) {
      res.status(404).json({ 
        error: 'UTR profile not configured',
        message: 'Please update your preferences with your UTR profile URL'
      });
      return;
    }

    // Return stored UTR rating
    // In production, you would fetch real-time data from UTR API
    res.json({
      utrRating: preferences.utrRating,
      profileUrl: preferences.utrProfileUrl,
      note: 'Connect to UTR API for real-time ratings. See codesearch for UTR API integration.'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Update UTR info
router.put('/my-utr', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const { utrRating, utrProfileUrl } = req.body;

  try {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        utrRating,
        utrProfileUrl
      },
      create: {
        userId,
        utrRating,
        utrProfileUrl
      }
    });

    res.json({ 
      message: 'UTR information updated successfully',
      preferences 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Search UTR player (placeholder for UTR API integration)
router.get('/search', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  // This is a placeholder. In production, you would call the UTR API
  // Example: const response = await fetch(`https://api.universaltennis.com/players?search=${query}`, {
  //   headers: { 'Authorization': `Bearer ${process.env.UTR_API_KEY}` }
  // });
  
  res.json({
    message: 'UTR API integration required',
    note: 'To implement UTR search, you need to:\n1. Sign up for UTR API access at universaltennis.com\n2. Store API key in environment variables\n3. Implement API calls to UTR endpoints',
    searchQuery: query,
    documentation: 'See https://app.universaltennis.com for API documentation'
  });
});

export default router;