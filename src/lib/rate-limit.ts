import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitName = "login" | "passwordReset" | "verification";

const rules: Record<LimitName, { count: number; window: Parameters<typeof Ratelimit.slidingWindow>[1] }> = {
  login: { count: 5, window: "15 m" },
  passwordReset: { count: 3, window: "1 h" },
  verification: { count: 5, window: "1 h" },
};
const memory = new Map<string, { count: number; reset: number }>();
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const distributed = redis ? Object.fromEntries(Object.entries(rules).map(([name, rule]) => [name, new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(rule.count, rule.window) })])) as Record<LimitName, Ratelimit> : null;

export async function checkRateLimit(name: LimitName, key: string) {
  if (distributed) {
    const result = await distributed[name].limit(key);
    return { success: result.success, remaining: result.remaining };
  }
  const now = Date.now();
  const rule = rules[name];
  const window = name === "login" ? 15 * 60_000 : 60 * 60_000;
  const id = `${name}:${key}`;
  const current = memory.get(id);
  if (!current || current.reset <= now) {
    memory.set(id, { count: 1, reset: now + window });
    return { success: true, remaining: rule.count - 1 };
  }
  current.count += 1;
  return { success: current.count <= rule.count, remaining: Math.max(0, rule.count - current.count) };
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
