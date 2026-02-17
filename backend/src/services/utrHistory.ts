export type UtrHistoryClient = {
  utrHistory: {
    findFirst: (args: {
      where: { userId: number };
      orderBy: { recordedAt: 'desc' };
      select: { rating: true };
    }) => Promise<{ rating: number } | null>;
    create: (args: { data: { userId: number; rating: number } }) => Promise<unknown>;
  };
};

export const recordUtrHistoryIfChanged = async (
  client: UtrHistoryClient,
  userId: number,
  rating: number | null
): Promise<boolean> => {
  if (rating == null || !Number.isFinite(rating)) return false;

  const latest = await client.utrHistory.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    select: { rating: true },
  });

  if (latest && latest.rating === rating) return false;

  await client.utrHistory.create({
    data: {
      userId,
      rating,
    },
  });

  return true;
};
