import { FastifyPluginAsync } from 'fastify';
import { conversationService } from './conversation.service';
import { whatsappService } from '../whatsapp/whatsapp.service';
import PropertyConfig from '../property/property.model';
import { LeadScore } from './conversation.model';

export const conversationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /conversations — list all conversations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (req) => {
    const query = req.query as Record<string, string>;
    const property = await PropertyConfig.findOne({ isActive: true });
    if (!property) return [];

    return conversationService.listConversations(property._id.toString(), {
      leadScore: query.leadScore as LeadScore | undefined,
      needsHumanReview: query.needsHumanReview === 'true' ? true : undefined,
    });
  });

  // GET /conversations/:id — get conversation with messages
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const messages = await conversationService.getRecentMessages(id as any, 100);
    return { messages };
  });

  // PATCH /conversations/:id — update lead score / notes manually
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { leadScore?: LeadScore; notes?: string; isHandedOff?: boolean };
    const { Conversation } = await import('./conversation.model');
    return Conversation.findByIdAndUpdate(id, { $set: body }, { new: true });
  });

  // POST /conversations/:id/reply — co-founder sends manual reply
  fastify.post('/:id/reply', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { message } = req.body as { message: string };
    const { Conversation } = await import('./conversation.model');

    const conversation = await Conversation.findById(id);
    if (!conversation) return reply.status(404).send({ error: 'Conversation not found' });

    const waMessageId = await whatsappService.sendText(conversation.tenantPhone, message);

    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId: conversation.propertyId.toString(),
      tenantPhone: conversation.tenantPhone,
      direction: 'outbound',
      content: message,
      waMessageId,
    });

    return { success: true, waMessageId };
  });

  // GET /stats/today — today's dashboard stats
  fastify.get('/stats/today', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const property = await PropertyConfig.findOne({ isActive: true });
    if (!property) return { total: 0, hot: 0, warm: 0, cold: 0, escalations: 0, viewingRequests: 0 };
    return conversationService.getTodayStats(property._id.toString());
  });
};
