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

export function setCfEnv(env: unknown) {
  if (env && typeof env === "object") (globalThis as Record<string, unknown>)[KEY] = env;
}

type AnyRecord = Record<string, unknown>;

/**
 * Resolves the Worker `env` bindings. In production Nitro's cloudflare-module entry
 * receives `fetch(request, env, ctx)` first: it stores env on `globalThis.__env__`
 * and on `request.runtime.cloudflare.env`. Our src/server.ts wrapper is NOT the
 * outer Worker export, so its own capture alone is never enough.
 */
let workersEnv: AnyRecord | null | undefined;

/**
 * Loads Cloudflare's canonical runtime env (`import { env } from "cloudflare:workers"`).
 * The specifier is computed so the bundler leaves it for workerd to resolve; outside
 * Cloudflare the import fails and we cache null.
 */
export async function loadWorkersEnv(): Promise<AnyRecord | null> {
  if (workersEnv !== undefined) return workersEnv;
  try {
    const spec = ["cloudflare", "workers"].join(":");
    const mod = (await import(/* @vite-ignore */ spec)) as { env?: AnyRecord };
    workersEnv = mod.env ?? null;
  } catch {
    workersEnv = null;
  }
  return workersEnv;
}

export function getCfEnv(request?: Request): CfEnv {
  const g = globalThis as AnyRecord;
  const req = request as unknown as
    | { runtime?: { cloudflare?: { env?: AnyRecord } }; env?: AnyRecord }
    | undefined;
  const candidates = [
    workersEnv ?? undefined,
    req?.runtime?.cloudflare?.env,
    req?.env,
    g['__env__'] as AnyRecord | undefined,
    g[KEY] as AnyRecord | undefined,
  ];
  const merged: AnyRecord = {};
  for (const c of candidates.reverse()) if (c && typeof c === "object") Object.assign(merged, c);
  // The cloudflare:workers env is a proxy; read bindings explicitly.
  for (const c of [workersEnv, req?.runtime?.cloudflare?.env, g['__env__'] as AnyRecord | undefined]) {
    if (!c) continue;
    if (!merged['DB'] && c['DB']) merged['DB'] = c['DB'];
    if (!merged['MEDIA'] && c['MEDIA']) merged['MEDIA'] = c['MEDIA'];
    if (!merged['CLERK_SECRET_KEY'] && c['CLERK_SECRET_KEY']) merged['CLERK_SECRET_KEY'] = c['CLERK_SECRET_KEY'];
    if (!merged['CLERK_WEBHOOK_SECRET'] && c['CLERK_WEBHOOK_SECRET'])
      merged['CLERK_WEBHOOK_SECRET'] = c['CLERK_WEBHOOK_SECRET'];
  }
  if (!merged['DB'] && g['DB']) merged['DB'] = g['DB'];
  if (!merged['MEDIA'] && g['MEDIA']) merged['MEDIA'] = g['MEDIA'];
  return merged as CfEnv;
}

/** Async variant: makes sure the cloudflare:workers env is loaded first. */
export async function cfEnv(request?: Request): Promise<CfEnv> {
  await loadWorkersEnv();
  return getCfEnv(request);
}

export function getDb(request?: Request): D1Database | null {
  return getCfEnv(request).DB ?? null;
}

export async function db(request?: Request): Promise<D1Database | null> {
  return (await cfEnv(request)).DB ?? null;
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
