import "server-only";

export interface PrizeRecord {
  code: string;
  email: string;
  fingerprint: string;
  ipHash: string;
  issuedAt: number;
  expiresAt: number;
  redeemedAt: number | null;
}

/**
 * Everything the game persists. The in-memory version below is enough for a demo on one server process;
 * for production, implement this with Postgres/Redis/Supabase and swap it in `getStore()`.
 * Every method that guards a limit must be atomic in a real implementation.
 */
export interface GameStore {
  /** Atomically increments a per-day counter and returns the new value. */
  increment(key: string, day: string): Promise<number>;
  get(key: string, day: string): Promise<number>;
  /** Marks a nonce as used. Resolves false if it was already used. */
  useNonce(nonce: string): Promise<boolean>;
  /** Takes one prize from today's budget. Resolves false if the budget is spent. */
  takePrize(day: string, budget: number): Promise<boolean>;
  countPrizesForEmail(email: string): Promise<number>;
  savePrize(prize: PrizeRecord): Promise<void>;
  findPrize(code: string): Promise<PrizeRecord | null>;
  /** Marks a code redeemed. Resolves the updated record, or null if unknown. Already-redeemed codes are returned unchanged. */
  redeemPrize(code: string): Promise<PrizeRecord | null>;
}

class MemoryStore implements GameStore {
  private counters = new Map<string, number>();
  private nonces = new Set<string>();
  private prizes = new Map<string, PrizeRecord>();

  async increment(key: string, day: string) {
    const k = `${day}:${key}`;
    const next = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, next);
    return next;
  }
  async get(key: string, day: string) {
    return this.counters.get(`${day}:${key}`) ?? 0;
  }
  async useNonce(nonce: string) {
    if (this.nonces.has(nonce)) return false;
    this.nonces.add(nonce);
    return true;
  }
  async takePrize(day: string, budget: number) {
    const k = `${day}:prizes`;
    const used = this.counters.get(k) ?? 0;
    if (used >= budget) return false;
    this.counters.set(k, used + 1);
    return true;
  }
  async countPrizesForEmail(email: string) {
    let n = 0;
    for (const p of this.prizes.values()) if (p.email === email) n++;
    return n;
  }
  async savePrize(prize: PrizeRecord) {
    this.prizes.set(prize.code, prize);
  }
  async findPrize(code: string) {
    return this.prizes.get(code) ?? null;
  }
  async redeemPrize(code: string) {
    const prize = this.prizes.get(code);
    if (!prize) return null;
    if (prize.redeemedAt === null) prize.redeemedAt = Date.now();
    return prize;
  }
}

// survives dev hot reloads; resets when the server restarts
const globalForStore = globalThis as unknown as { __milkabooGameStore?: GameStore };

export function getStore(): GameStore {
  globalForStore.__milkabooGameStore ??= new MemoryStore();
  return globalForStore.__milkabooGameStore;
}
