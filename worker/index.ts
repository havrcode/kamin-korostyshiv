import { handleLeadApiRequest, type LeadWorkerEnv } from "../server/leads/http.ts";
import {
  processNotificationOutbox,
  type NotificationWorkerEnv,
} from "../server/notifications/processor.ts";

export type Env = LeadWorkerEnv & NotificationWorkerEnv;

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
    context?: ExecutionContextLike,
  ): Promise<Response> {
    const response = await handleLeadApiRequest(request, env);
    if ((response.status === 200 || response.status === 201) && context) {
      context.waitUntil(processNotificationOutbox(env, { limit: 1 }));
    }
    return response;
  },

  scheduled(_controller: unknown, env: Env, context: ExecutionContextLike): void {
    context.waitUntil(processNotificationOutbox(env));
  },
};

export default worker;
