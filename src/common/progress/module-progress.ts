import { PrismaService } from 'src/prisma/prisma.service';

export type ModuleProgress = { known: number; learning: number; unstudied: number; total: number };

export const emptyProgress = (): ModuleProgress => ({ known: 0, learning: 0, unstudied: 0, total: 0 });

export async function attachModuleProgress<T extends { id: string }>(
  prisma: PrismaService,
  modules: T[],
): Promise<(T & { progress: ModuleProgress })[]> {
  if (!modules.length) return modules.map((m) => ({ ...m, progress: emptyProgress() }));

  const rows = await prisma.flashcard.groupBy({
    by: ['moduleId', 'status'],
    where: { moduleId: { in: modules.map((m) => m.id) } },
    _count: { _all: true },
  });

  const byModule = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const entry = byModule.get(row.moduleId) ?? {};
    entry[row.status] = row._count._all;
    byModule.set(row.moduleId, entry);
  }

  return modules.map((m) => {
    const counts = byModule.get(m.id) ?? {};
    const known = counts.KNOWN ?? 0;
    const learning = counts.STILL_LEARNING ?? 0;
    const unstudied = counts.UNSTUDIED ?? 0;
    return { ...m, progress: { known, learning, unstudied, total: known + learning + unstudied } };
  });
}
