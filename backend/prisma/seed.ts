import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const seedUsers = [
  {
    email: 'ava.player@example.com',
    password: 'password123',
    firstName: 'Ava',
    lastName: 'Chen',
    preferences: {
      primaryHand: 'right',
      playStyle: 'Aggressive baseliner',
      backhandType: 'two-handed',
      utrRating: 8.2,
      utrProfileUrl: 'https://app.universaltennis.com/profiles/ava-chen'
    },
    utrHistory: [
      { rating: 7.6, recordedAt: '2024-01-15' },
      { rating: 7.9, recordedAt: '2024-04-12' },
      { rating: 8.2, recordedAt: '2024-08-05' }
    ],
    journal: [
      {
        title: 'Serve focus session',
        content: 'Worked on wide slice and second-serve kick; felt more consistent under pressure.',
        entryDate: '2024-08-06'
      },
      {
        title: 'Match prep checklist',
        content: 'Dynamic warmup, return targets, and first-strike patterns.',
        entryDate: '2024-08-12'
      }
    ],
    matches: [
      {
        opponentName: 'Jordan Lee',
        opponentUtr: 8.0,
        matchDate: '2024-08-10',
        location: 'Bay Courts',
        surface: 'hard',
        userSetsWon: 2,
        opponentSetsWon: 1,
        matchScore: '6-4, 3-6, 6-2',
        result: 'win',
        notes: 'Won by staying aggressive on second serves.'
      },
      {
        opponentName: 'Priya Singh',
        opponentUtr: 8.4,
        matchDate: '2024-07-28',
        location: 'Marina Club',
        surface: 'hard',
        userSetsWon: 1,
        opponentSetsWon: 2,
        matchScore: '6-7(5), 6-3, 4-6',
        result: 'loss',
        notes: 'Lost a few key points on return games.'
      }
    ]
  },
  {
    email: 'maria.kim@example.com',
    password: 'password123',
    firstName: 'Maria',
    lastName: 'Kim',
    preferences: {
      primaryHand: 'left',
      playStyle: 'All-court',
      backhandType: 'one-handed',
      utrRating: 6.9,
      utrProfileUrl: 'https://app.universaltennis.com/profiles/maria-kim'
    },
    utrHistory: [
      { rating: 6.4, recordedAt: '2024-02-01' },
      { rating: 6.7, recordedAt: '2024-05-20' },
      { rating: 6.9, recordedAt: '2024-09-01' }
    ],
    journal: [
      {
        title: 'Backhand depth',
        content: 'Focused on staying through the backhand; improved depth on cross-court rally.',
        entryDate: '2024-09-02'
      }
    ],
    matches: [
      {
        opponentName: 'Nina Patel',
        opponentUtr: 6.8,
        matchDate: '2024-09-05',
        location: 'River Park',
        surface: 'clay',
        userSetsWon: 2,
        opponentSetsWon: 0,
        matchScore: '6-3, 6-4',
        result: 'win',
        notes: 'Used slice to neutralize heavy topspin.'
      }
    ]
  }
];

const resetUserData = async (userId: number): Promise<void> => {
  await prisma.utrHistory.deleteMany({ where: { userId } });
  await prisma.journalEntry.deleteMany({ where: { userId } });
  await prisma.tennisMatch.deleteMany({ where: { userId } });
  await prisma.userPreferences.deleteMany({ where: { userId } });
};

const main = async (): Promise<void> => {
  for (const seedUser of seedUsers) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        password: passwordHash,
      },
      create: {
        email: seedUser.email,
        password: passwordHash,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
      },
    });

    await resetUserData(user.id);

    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        primaryHand: seedUser.preferences.primaryHand,
        playStyle: seedUser.preferences.playStyle,
        backhandType: seedUser.preferences.backhandType,
        utrRating: seedUser.preferences.utrRating,
        utrProfileUrl: seedUser.preferences.utrProfileUrl,
      }
    });

    await prisma.utrHistory.createMany({
      data: seedUser.utrHistory.map(entry => ({
        userId: user.id,
        rating: entry.rating,
        recordedAt: new Date(entry.recordedAt),
      }))
    });

    await prisma.journalEntry.createMany({
      data: seedUser.journal.map(entry => ({
        userId: user.id,
        title: entry.title,
        content: entry.content,
        entryDate: new Date(entry.entryDate),
      }))
    });

    await prisma.tennisMatch.createMany({
      data: seedUser.matches.map(match => ({
        userId: user.id,
        opponentName: match.opponentName,
        opponentUtr: match.opponentUtr,
        matchDate: new Date(match.matchDate),
        location: match.location,
        surface: match.surface,
        userSetsWon: match.userSetsWon,
        opponentSetsWon: match.opponentSetsWon,
        matchScore: match.matchScore,
        result: match.result,
        notes: match.notes,
      }))
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
