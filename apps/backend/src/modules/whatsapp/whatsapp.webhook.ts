export interface ParsedWebhookMessage {
  phone: string;
  message: string;
  waMessageId: string;
  timestamp: number;
  profileName?: string;
}

export function parseWebhookPayload(body: unknown): ParsedWebhookMessage | null {
  try {
    const payload = body as Record<string, unknown>;

    if (payload.object !== 'whatsapp_business_account') return null;

    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown>;
    const contacts = value?.contacts as unknown[] | undefined;

    const messages = value?.messages as unknown[];
    if (!messages?.length) return null;

    const msg = messages[0] as Record<string, unknown>;

    if (msg.type !== 'text') return null;

    const text = msg.text as Record<string, unknown>;
    const contact = contacts?.[0] as Record<string, unknown> | undefined;
    const profile = contact?.profile as Record<string, unknown> | undefined;

    return {
      phone: (msg.from as string) ?? '',
      message: (text?.body as string) ?? '',
      waMessageId: (msg.id as string) ?? '',
      timestamp: Number(msg.timestamp) ?? Date.now(),
      profileName: (profile?.name as string) ?? undefined,
    };
  } catch {
    return null;
  }
}
