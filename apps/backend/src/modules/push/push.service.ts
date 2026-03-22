import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

function reasonToText(reason: string): string {
  const map: Record<string, string> = {
    viewing_requested: 'Wants to arrange a viewing',
    price_negotiation: 'Negotiating price — needs your input',
    ready_to_commit: 'Ready to take the flat!',
    unknown_question: "Has a question I couldn't answer",
  };
  return map[reason] || 'Needs your attention';
}

export const pushService = {
  async sendEscalationNotification(
    pushToken: string,
    conversationId: string,
    tenantName: string,
    reason: string
  ): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`[push] Invalid Expo push token: ${pushToken}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title: '🔔 Flat Inquiry Needs You',
      body: `${tenantName || 'A prospect'}: ${reasonToText(reason)}`,
      data: { conversationId, screen: 'conversation' },
    };

    try {
      const chunks = expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      console.error('[push] Failed to send push notification:', err);
    }
  },
};
