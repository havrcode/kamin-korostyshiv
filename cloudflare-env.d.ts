/**
 * Мінімальні runtime-типи, потрібні поточній заготовці Worker.
 * Повний тип `Env` буде згенеровано Wrangler після створення власних D1/R2.
 */
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1Database {
  readonly __D1DatabaseBrand?: never;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
