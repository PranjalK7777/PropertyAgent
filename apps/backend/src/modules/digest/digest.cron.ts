import cron from 'node-cron';
import { generateAndSendDailyDigest } from './digest.service';
import PropertyConfig from '../property/property.model';
import { env } from '../../config/env';

export function startDigestCron(): void {
  const cronExpression = env.DIGEST_CRON_UTC; // default: 30 15 * * * (9pm IST)

  cron.schedule(cronExpression, async () => {
    console.log('[digest-cron] Running daily digest job...');
    try {
      const property = await PropertyConfig.findOne({ isActive: true });
      if (!property) {
        console.warn('[digest-cron] No active property found, skipping digest');
        return;
      }
      await generateAndSendDailyDigest(property._id.toString());
      console.log('[digest-cron] Daily digest sent successfully');
    } catch (err) {
      console.error('[digest-cron] Failed to send daily digest:', err);
    }
  }, { timezone: 'UTC' });

  console.log(`[digest-cron] Scheduled: ${cronExpression} UTC (9pm IST)`);
}
