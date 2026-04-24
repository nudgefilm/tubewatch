import type {
  ManusProjectCreateResponse,
  ManusTaskCreateResponse,
  ManusTaskMessagesResponse,
} from "./types";

const BASE_URL = process.env.MANUS_API_BASE_URL ?? "https://api.manus.ai";

function headers() {
  const key = process.env.MANUS_API_KEY;
  if (!key) throw new Error("MANUS_API_KEY is not set");
  return {
    "Content-Type": "application/json",
    "x-manus-api-key": key,
  };
}

export async function createProject(name: string, instruction: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/v2/project.create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, instruction }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus project.create failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as ManusProjectCreateResponse;
  return data.id;
}

export async function createTask(
  projectId: string,
  content: string,
  webhookUrl?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    project_id: projectId,
    message: { role: "user", content },
  };
  if (webhookUrl) body.webhook_url = webhookUrl;

  const res = await fetch(`${BASE_URL}/v2/task.create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus task.create failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as ManusTaskCreateResponse;
  return data.task_id;
}

export async function getTaskMessages(taskId: string): Promise<ManusTaskMessagesResponse> {
  const res = await fetch(
    `${BASE_URL}/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus task.listMessages failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<ManusTaskMessagesResponse>;
}

export async function registerWebhook(url: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v2/webhook.create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url, events: ["task_stopped"] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Manus webhook.create failed: ${res.status} ${text}`);
  }
}
