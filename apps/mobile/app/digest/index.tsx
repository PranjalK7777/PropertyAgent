import { Stack } from 'expo-router';
import { DigestFeed } from '../../components/digest/digest-feed';
import { theme } from '../../components/ui/theme';

export default function DigestHistoryScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Digest History',
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: theme.colors.canvas },
          headerTintColor: theme.colors.ink,
          headerTitleStyle: { fontWeight: '700', color: theme.colors.ink },
        }}
      />
      <DigestFeed />
    </>
  );
}
