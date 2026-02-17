import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const seedCoaches = [
  {
    email: 'coach.riley@example.com',
    password: 'password123',
    firstName: 'Riley',
    lastName: 'Morgan',
  },
  {
    email: 'coach.sofia@example.com',
    password: 'password123',
    firstName: 'Sofia',
    lastName: 'Lopez',
  }
];

const seedStudents = [
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
  await prisma.profileComment.deleteMany({ where: { studentId: userId } });
  await prisma.matchComment.deleteMany({ where: { studentId: userId } });
  await prisma.journalComment.deleteMany({ where: { studentId: userId } });
  await prisma.coachInvite.deleteMany({ where: { studentId: userId } });
  await prisma.utrHistory.deleteMany({ where: { userId } });
  await prisma.journalEntry.deleteMany({ where: { userId } });
  await prisma.tennisMatch.deleteMany({ where: { userId } });
  await prisma.userPreferences.deleteMany({ where: { userId } });
};

const main = async (): Promise<void> => {
  const coachMap = new Map<string, { id: number; email: string }>();
  for (const seedCoach of seedCoaches) {
    const passwordHash = await bcrypt.hash(seedCoach.password, 10);
    const coach = await prisma.user.upsert({
      where: { email: seedCoach.email },
      update: {
        firstName: seedCoach.firstName,
        lastName: seedCoach.lastName,
        password: passwordHash,
        role: 'coach',
      },
      create: {
        email: seedCoach.email,
        password: passwordHash,
        firstName: seedCoach.firstName,
        lastName: seedCoach.lastName,
        role: 'coach',
      },
    });
    coachMap.set(seedCoach.email, { id: coach.id, email: coach.email });
  }

  const studentMap = new Map<string, { id: number; email: string }>();
  for (const seedUser of seedStudents) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        password: passwordHash,
        role: 'student',
      },
      create: {
        email: seedUser.email,
        password: passwordHash,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        role: 'student',
      },
    });

    studentMap.set(seedUser.email, { id: user.id, email: user.email });

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

  const coachIds = Array.from(coachMap.values()).map(coach => coach.id);
  const studentIds = Array.from(studentMap.values()).map(student => student.id);
  if (coachIds.length > 0 || studentIds.length > 0) {
    await prisma.profileComment.deleteMany({
      where: {
        OR: [
          { studentId: { in: studentIds } },
          { coachId: { in: coachIds } },
        ],
      },
    });
    await prisma.journalComment.deleteMany({
      where: {
        OR: [
          { studentId: { in: studentIds } },
          { coachId: { in: coachIds } },
        ],
      },
    });
    await prisma.matchComment.deleteMany({
      where: {
        OR: [
          { studentId: { in: studentIds } },
          { coachId: { in: coachIds } },
        ],
      },
    });
    await prisma.coachInvite.deleteMany({
      where: {
        OR: [
          { studentId: { in: studentIds } },
          { coachId: { in: coachIds } },
        ],
      },
    });
  }

  const ava = studentMap.get('ava.player@example.com');
  const maria = studentMap.get('maria.kim@example.com');
  const coachRiley = coachMap.get('coach.riley@example.com');
  const coachSofia = coachMap.get('coach.sofia@example.com');

  if (ava && coachRiley) {
    await prisma.coachInvite.create({
      data: {
        studentId: ava.id,
        coachId: coachRiley.id,
        coachEmail: coachRiley.email,
        status: 'accepted',
      },
    });
  }

  if (maria && coachSofia) {
    await prisma.coachInvite.create({
      data: {
        studentId: maria.id,
        coachId: coachSofia.id,
        coachEmail: coachSofia.email,
        status: 'pending',
      },
    });
  }

  if (ava && coachRiley) {
    await prisma.profileComment.create({
      data: {
        studentId: ava.id,
        coachId: coachRiley.id,
        content: 'Strong baseline game. Let’s set a weekly serve goal and track first-serve percentage.',
      },
    });

    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: ava.id },
      orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
      take: 1,
    });
    if (journalEntries[0]) {
      await prisma.journalComment.create({
        data: {
          journalEntryId: journalEntries[0].id,
          studentId: ava.id,
          coachId: coachRiley.id,
          content: 'Great focus on serve variety. Try adding a target for body serves.',
        },
      });
    }

    const matches = await prisma.tennisMatch.findMany({
      where: { userId: ava.id },
      orderBy: [{ matchDate: 'desc' }, { id: 'desc' }],
      take: 1,
    });
    if (matches[0]) {
      await prisma.matchComment.create({
        data: {
          matchId: matches[0].id,
          studentId: ava.id,
          coachId: coachRiley.id,
          content: 'Good win. Next time, look for earlier forehand opportunities on short balls.',
        },
      });
    }
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
