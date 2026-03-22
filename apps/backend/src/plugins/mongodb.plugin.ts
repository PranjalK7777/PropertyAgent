import mongoose from 'mongoose';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env';

const mongoPluginFn: FastifyPluginAsync = async (fastify) => {
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

export const mongoPlugin = fp(mongoPluginFn);
