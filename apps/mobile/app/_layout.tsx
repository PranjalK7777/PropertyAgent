import '../global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/api';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const navigationReady = Boolean(rootNavigationState?.key);
  const firstSegment = segments[0];
  const inAuthGroup = firstSegment === '(auth)';
  const routeUnresolved = typeof firstSegment === 'undefined';
  const shouldRedirectToAuth = authReady && navigationReady && !session && (routeUnresolved || !inAuthGroup);
  const shouldRedirectToApp = authReady && navigationReady && !!session && (routeUnresolved || inAuthGroup);

  useEffect(() => {
    if (shouldRedirectToAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (shouldRedirectToApp) {
      router.replace('/(tabs)');
    }
  }, [router, shouldRedirectToApp, shouldRedirectToAuth]);

  if (!authReady || !navigationReady || shouldRedirectToAuth || shouldRedirectToApp) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#b85c38" />
      </View>
    );
  }

  return <Slot />;
}
