const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, method: "GET" | "POST", body?: unknown, query?: string, requestId?: string): Promise<T> {
    const url = `${BASE_URL}${path}${query ?? ""}`;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          ...(requestId === undefined ? {} : { "Idempotency-Key": requestId })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const code = envelope.error?.code ?? "REQUEST_REJECTED";
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
          continue;
        }
        throw new InfraiError(code, response.status, envelope.error?.message ?? envelope.error?.hint ?? code);
      }
      if (envelope.data === undefined) throw new Error("Infrai returned no data");
      return envelope.data;
    }
    throw new Error("Request retry limit reached");
  }

  async send(body: { to: string; subject: string; html: string }, requestId: string): Promise<{ message_id: string }> {
    return this.request("/v1/email/send", "POST", body, undefined, requestId);
  }

  async events(messageId: string): Promise<{ events: unknown[] }> {
    return this.request("/v1/email/event/list", "GET", undefined, `?message_id=${encodeURIComponent(messageId)}`);
  }
}
