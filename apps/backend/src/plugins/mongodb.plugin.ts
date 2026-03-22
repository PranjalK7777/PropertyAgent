import mongoose from 'mongoose';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';

export const mongoPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    fastify.log.info('✅ MongoDB connected');

    mongoose.connection.on('error', (err) => {
      fastify.log.error({ err }, 'MongoDB connection error');
    });

    fastify.addHook('onClose', async () => {
      await mongoose.connection.close();
      fastify.log.info('MongoDB connection closed');
    });
  } catch (err) {
    fastify.log.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};
