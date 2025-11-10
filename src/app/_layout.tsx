import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { supabase } from 'lib/supabase';
import { subscribeToAuthChanges } from 'features/auth/session';

export default function RootLayout() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		let unsub: (() => void) | undefined;
		
		(async () => {
			// Check initial auth state
			const { data } = await supabase.auth.getSession();
			const initialAuthed = !!data.session;
			setIsAuthenticated(initialAuthed);
			
			// Subscribe to auth changes
			unsub = subscribeToAuthChanges(async () => {
				const { data: s } = await supabase.auth.getSession();
				const isAuthed = !!s.session;
				setIsAuthenticated(isAuthed);
			});
		})();
		
		return () => {
			if (unsub) unsub();
		};
	}, []);

	useEffect(() => {
		if (isAuthenticated === null) return;

		const inAuthGroup = segments[0] === '(auth)';
		const inTabsGroup = segments[0] === '(tabs)';

		if (isAuthenticated && inAuthGroup) {
			// Redirect authenticated users away from auth screens
			router.replace('/(tabs)/profile');
		} else if (!isAuthenticated && inTabsGroup) {
			// Redirect unauthenticated users away from protected screens
			router.replace('/(auth)/welcome');
		} else if (!isAuthenticated && segments.length === 0) {
			// Initial load for unauthenticated users
			router.replace('/(auth)/welcome');
		} else if (isAuthenticated && segments.length === 0) {
			// Initial load for authenticated users
			router.replace('/(tabs)/profile');
		}
	}, [isAuthenticated, segments]);

	// Show nothing while checking auth state
	if (isAuthenticated === null) {
		return null;
	}

	return <Slot />;
}

