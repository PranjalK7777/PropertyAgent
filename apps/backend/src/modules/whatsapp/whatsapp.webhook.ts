export interface ParsedWebhookMessage {
  phone: string;
  message: string;
  waMessageId: string;
  timestamp: number;
}

export function parseWebhookPayload(body: unknown): ParsedWebhookMessage | null {
  try {
    const payload = body as Record<string, unknown>;

    if (payload.object !== 'whatsapp_business_account') return null;

    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown>;

    const messages = value?.messages as unknown[];
    if (!messages?.length) return null;

    const msg = messages[0] as Record<string, unknown>;

    if (msg.type !== 'text') return null;

    const text = msg.text as Record<string, unknown>;

    return {
      phone: (msg.from as string) ?? '',
      message: (text?.body as string) ?? '',
      waMessageId: (msg.id as string) ?? '',
      timestamp: Number(msg.timestamp) ?? Date.now(),
    };
  } catch {
    return null;
  }
}
