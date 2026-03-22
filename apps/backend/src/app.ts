import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { mongoPlugin } from './plugins/mongodb.plugin';
import { authPlugin } from './plugins/auth.plugin';
import { webhookRoutes } from './routes/webhook.routes';
import { propertyRoutes } from './modules/property/property.routes';
import { conversationRoutes } from './modules/ai-agent/conversation.routes';
import { pushRoutes } from './modules/push/push.routes';
import { digestRoutes } from './modules/digest/digest.routes';
import { startDigestCron } from './modules/digest/digest.cron';
import { env } from './config/env';

const app = Fastify({ logger: true });

app.register(mongoPlugin);
app.register(authPlugin);
app.register(multipart);

app.register(webhookRoutes, { prefix: '/webhook' });
app.register(propertyRoutes, { prefix: '/property' });
app.register(conversationRoutes, { prefix: '/conversations' });
app.register(pushRoutes, { prefix: '/push' });
app.register(digestRoutes, { prefix: '/digest' });

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  startDigestCron();
  app.log.info(`🚀 Property Agent backend running on port ${env.PORT}`);
});
