/** Sheet default base capital when no live portfolio is loaded. */
export const SHEET_BASE_CAPITAL = 7_215_525.5;

/** Conservative deposit rates by year (from Summary.xlsx). */
export const DEFAULT_CONSERVATIVE_RATES = [0.0248, 0.0248, 0.02, 0.02, 0.01, 0.01] as const;

/** Default high-risk / target portfolio yield per year. */
export const DEFAULT_TARGET_RATE = 0.05;

export const TARGET_RATE_PRESETS = [0.05, 0.06, 0.07] as const;

export type ProjectionYearRow = {
  yearIndex: number;
  cRate: number;
  tRate: number;
  cBase: number;
  cInterest: number;
  tBase: number;
  tInterest: number;
};

export function buildProjectionRows(
  baseCapital: number,
  conservativeRates: readonly number[],
  targetRates: readonly number[],
): ProjectionYearRow[] {
  let currentCBase = baseCapital;
  let currentTBase = baseCapital;
  const years = Math.max(conservativeRates.length, targetRates.length, 6);

  return Array.from({ length: years }, (_, index) => {
    const cRate = conservativeRates[index] ?? conservativeRates.at(-1) ?? 0;
    const tRate = targetRates[index] ?? targetRates.at(-1) ?? DEFAULT_TARGET_RATE;
    const cBaseNext = currentCBase * (1 + cRate);
    const cInterest = cBaseNext * cRate;
    currentCBase = cBaseNext;

    const tBaseNext = currentTBase * (1 + tRate);
    const tInterest = tBaseNext * tRate;
    currentTBase = tBaseNext;

    return {
      yearIndex: index,
      cRate,
      tRate,
      cBase: cBaseNext,
      cInterest,
      tBase: tBaseNext,
      tInterest,
    };
  });
}

export function percentToRate(input: string): number {
  const value = parseFloat(input);
  if (Number.isNaN(value)) return 0;
  return value > 1 ? value / 100 : value;
}

export function rateToPercentInput(rate: number): string {
  return (rate * 100).toFixed(2);
}
