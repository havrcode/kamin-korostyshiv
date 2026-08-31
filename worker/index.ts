import { handleLeadApiRequest, type LeadWorkerEnv } from "../server/leads/http.ts";

export type Env = LeadWorkerEnv;

const worker = {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleLeadApiRequest(request, env);
  },
};

export default worker;
