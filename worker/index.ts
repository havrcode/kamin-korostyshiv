import { handleLeadApiRequest, type LeadWorkerEnv } from "../server/leads/http.ts";
import {
  processNotificationOutbox,
  type NotificationWorkerEnv,
} from "../server/notifications/processor.ts";
import { handleAdminApiRequest, type AdminWorkerEnv } from "../server/admin/leads.ts";

export type Env = LeadWorkerEnv & NotificationWorkerEnv & AdminWorkerEnv;

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

export function shouldProcessOutbox(pathname: string, status: number): boolean {
  return pathname === "/api/v1/leads" && (status === 200 || status === 201);
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
    context?: ExecutionContextLike,
  ): Promise<Response> {
    const url = new URL(request.url);
    const response = url.pathname.startsWith("/api/v1/admin/")
      ? await handleAdminApiRequest(request, env)
      : await handleLeadApiRequest(request, env);
    if (shouldProcessOutbox(url.pathname, response.status) && context) {
      context.waitUntil(processNotificationOutbox(env, { limit: 1 }));
    }
    return response;
  },

  scheduled(_controller: unknown, env: Env, context: ExecutionContextLike): void {
    context.waitUntil(processNotificationOutbox(env));
  },
};

export default worker;
