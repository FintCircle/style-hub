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
  MEDIA_PUBLIC_URL?: string;
};

const KEY = "__lebehoCfEnv";

export function setCfEnv(env: unknown) {
  if (env && typeof env === "object") (globalThis as Record<string, unknown>)[KEY] = env;
}

export function getCfEnv(): CfEnv {
  return ((globalThis as Record<string, unknown>)[KEY] as CfEnv | undefined) ?? {};
}

export function getDb(): D1Database | null {
  return getCfEnv().DB ?? null;
}

export function getClerkSecret(): string | undefined {
  return getCfEnv().CLERK_SECRET_KEY ?? process.env["CLERK_SECRET_KEY"];
}

export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  const base = getCfEnv().MEDIA_PUBLIC_URL ?? "https://media.lebeho.com";
  return `${base.replace(/\/$/, "")}/${key}`;
}
