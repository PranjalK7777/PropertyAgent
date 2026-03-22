import { FastifyPluginAsync } from 'fastify';
import mongoose, { Schema } from 'mongoose';

// Inline push token model (simple)
const pushTokenSchema = new Schema(
  {
    userId: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
  },
  { timestamps: true, collection: 'push_tokens' }
);

const PushToken = mongoose.model('PushToken', pushTokenSchema);

export const pushRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /push/register — register Expo push token from mobile app
  fastify.post('/register', {
    preHandler: [fastify.authenticate],
  }, async (req) => {
    const { token, platform } = req.body as { token: string; platform: 'ios' | 'android' };
    const user = (req as any).user;

    await PushToken.findOneAndUpdate(
      { token },
      { userId: user.id, token, platform },
      { upsert: true, new: true }
    );

    // Also update property config ownerPushToken for immediate escalation use
    const PropertyConfig = (await import('../property/property.model')).default;
    await PropertyConfig.findOneAndUpdate({ isActive: true }, { ownerPushToken: token });

    return { success: true };
  });
};
