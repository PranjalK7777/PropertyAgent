import { env } from '../../config/env';

interface WhatsAppTextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

interface WhatsAppImagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image';
  image: { link: string; caption?: string };
}

interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string };
    components: unknown[];
  };
}

export class WhatsAppService {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    this.headers = {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async sendText(to: string, text: string): Promise<string> {
    const payload: WhatsAppTextPayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };
    return this.send(payload);
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<string> {
    const payload: WhatsAppImagePayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    };
    return this.send(payload);
  }

  async sendTemplate(to: string, templateName: string, components: unknown[]): Promise<string> {
    const payload: WhatsAppTemplatePayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    };
    return this.send(payload);
  }

  private async send(payload: unknown): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as { messages?: { id: string }[] };
    return data.messages?.[0]?.id ?? '';
  }
}

export const whatsappService = new WhatsAppService();
