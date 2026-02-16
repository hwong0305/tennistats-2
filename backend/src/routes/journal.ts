import { Router } from 'express';
import prisma from '../database.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get all journal entries for user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' }
    });
    res.json(entries);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Get single journal entry
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
    const entry = await prisma.journalEntry.findFirst({
      where: { 
        id,
        userId 
      }
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

// Create journal entry
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const { title, content, entryDate } = req.body;

  if (!title || !entryDate) {
    res.status(400).json({ error: 'Title and entry date are required' });
    return;
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        title,
        content,
        entryDate: new Date(entryDate)
      }
    });

    res.status(201).json({
      message: 'Journal entry created successfully',
      id: entry.id
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Update journal entry
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
  
  const { title, content, entryDate } = req.body;

  try {
    const entry = await prisma.journalEntry.updateMany({
      where: { 
        id,
        userId 
      },
      data: {
        title,
        content,
        entryDate: entryDate ? new Date(entryDate) : undefined
      }
    });

    if (entry.count === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    res.json({ message: 'Journal entry updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Delete journal entry
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
    const entry = await prisma.journalEntry.deleteMany({
      where: { 
        id,
        userId 
      }
    });

    if (entry.count === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;