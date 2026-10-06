/**
 * Cloudflare bindings. The Worker entry (src/server.ts) stores the `env` it receives
 * on every request; server functions and routes read it here. Outside Cloudflare
 * (e.g. the Lovable preview) bindings are absent and callers fall back gracefully.
 */
export type D1Result<T> = { results: T[] };
export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
};
export type D1Database = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
};
export type R2Bucket = {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Blob | string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export type CfEnv = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;
  MEDIA_PUBLIC_URL?: string;
};

const KEY = "__lebehoCfEnv";

type AnyRecord = Record<string, unknown>;

/**
 * Cloudflare's canonical binding source: `env` from the runtime module `cloudflare:workers`.
 * The specifier is built at runtime so Vite/Node (preview) never try to resolve it; on
 * workerd it resolves natively and exposes DB / MEDIA / secrets for the current request.
 */
let workersEnv: AnyRecord | undefined;
try {
  const specifier = ["cloudflare", "workers"].join(":");
  const mod = (await import(/* @vite-ignore */ specifier)) as { env?: AnyRecord };
  workersEnv = mod.env;
} catch {
  workersEnv = undefined;
}

export function setCfEnv(env: unknown) {
  if (env && typeof env === "object") (globalThis as AnyRecord)[KEY] = env;
}

function pick(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") return undefined;
  try {
    return (source as AnyRecord)[key];
  } catch {
    return undefined;
  }
}

/**
 * Resolves Worker bindings. Order: cloudflare:workers env, the request's
 * runtime.cloudflare.env (set by Nitro's Worker entry), globalThis.__env__, then the
 * wrapper capture. Keys are read individually because the workers env is a proxy.
 */
export function getCfEnv(request?: Request): CfEnv {
  const g = globalThis as AnyRecord;
  const req = request as unknown as
    { runtime?: { cloudflare?: { env?: AnyRecord } }; env?: AnyRecord } | undefined;
  const sources = [workersEnv, req?.runtime?.cloudflare?.env, req?.env, g["__env__"], g[KEY]];
  const out: AnyRecord = {};
  for (const key of [
    "DB",
    "MEDIA",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "MEDIA_PUBLIC_URL",
  ]) {
    for (const s of sources) {
      const v = pick(s, key);
      if (v) {
        out[key] = v;
        break;
      }
    }
  }
  return out as CfEnv;
}

export function getDb(request?: Request): D1Database | null {
  return getCfEnv(request).DB ?? null;
}

export function getClerkSecret(): string | undefined {
  return getCfEnv().CLERK_SECRET_KEY ?? process.env["CLERK_SECRET_KEY"];
}

export function getWebhookSecret(): string | undefined {
  return getCfEnv().CLERK_WEBHOOK_SECRET ?? process.env["CLERK_WEBHOOK_SECRET"];
}

export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  const base = getCfEnv().MEDIA_PUBLIC_URL ?? "https://media.lebeho.com";
  return `${base.replace(/\/$/, "")}/${key}`;
}
