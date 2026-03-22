import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';
import { parseWebhookPayload } from '../modules/whatsapp/whatsapp.webhook';
import { aiAgentService } from '../modules/ai-agent/ai-agent.service';
import PropertyConfig from '../modules/property/property.model';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Meta webhook verification handshake
  fastify.get('/webhook', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      fastify.log.info('WhatsApp webhook verified');
      return reply.send(Number(challenge));
    }

    return reply.status(403).send('Forbidden');
  });

  // Incoming messages from tenants
  fastify.post('/webhook', async (req, reply) => {
    // Respond to Meta immediately (< 20 seconds requirement)
    reply.send({ status: 'ok' });

    setImmediate(async () => {
      try {
        const parsed = parseWebhookPayload(req.body);
        if (!parsed) return;

        const { phone, message, waMessageId } = parsed;

        const property = await PropertyConfig.findOne({ isActive: true });
        if (!property) {
          fastify.log.warn('No active property config found');
          return;
        }

        await aiAgentService.handleInboundMessage({
          propertyId: property._id.toString(),
          tenantPhone: phone,
          message,
          waMessageId,
        });
      } catch (err) {
        fastify.log.error(err, 'Error processing webhook payload');
      }
    });
  });
};
