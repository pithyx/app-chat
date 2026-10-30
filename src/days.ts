/** Messages in groups of one day each, in their order, for a heading per day (design guidelines: groups in a list). */
export function byDay<T>(items: readonly T[], dayOf: (item: T) => string): { day: string; items: T[] }[] {
  const days: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = dayOf(item);
    const last = days.at(-1);
    if (last !== undefined && last.day === day) {
      last.items.push(item);
    } else {
      days.push({ day, items: [item] });
    }
  }
  return days;
}
