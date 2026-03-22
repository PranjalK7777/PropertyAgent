import { FastifyPluginAsync } from 'fastify';
import { generateAndSendDailyDigest } from './digest.service';
import DailyDigest from './digest.model';
import PropertyConfig from '../property/property.model';

export const digestRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /digest/trigger
  fastify.post('/trigger', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const property = await PropertyConfig.findOne({ isActive: true });
    if (!property) return reply.status(404).send({ error: 'No active property found' });

    await generateAndSendDailyDigest(property._id.toString());
    return { success: true, message: 'Daily digest sent' };
  });

  // GET /digest — list past daily digests
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const property = await PropertyConfig.findOne({ isActive: true });
    if (!property) return [];
    return DailyDigest.find({ propertyId: property._id }).sort({ date: -1 }).limit(30);
  });

  // GET /digest/:id — get single digest
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const digest = await DailyDigest.findById(id);
    if (!digest) return reply.status(404).send({ error: 'Digest not found' });
    return digest;
  });
};
