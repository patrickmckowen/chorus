import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { subscribeToAuthChanges } from 'features/auth/session';
import { supabase } from 'lib/supabase';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Function to check auth and redirect
    const checkAuthAndRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = !!data.session;

      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';

      if (isAuthenticated && inAuthGroup) {
        // Redirect authenticated users away from auth screens
        router.replace('/(tabs)/profile');
      } else if (!isAuthenticated && inTabsGroup) {
        // Redirect unauthenticated users away from protected screens
        router.replace('/(auth)/welcome');
      }
    };

    // Check initial auth state on mount
    checkAuthAndRedirect();

    // Subscribe to auth changes
    const unsub = subscribeToAuthChanges(() => {
      checkAuthAndRedirect();
    });

    return () => {
      if (unsub) unsub();
    };
  }, [router, segments]);

  return <Slot />;
}
