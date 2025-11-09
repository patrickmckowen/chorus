import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from 'screens/WelcomeScreen';
import ProfileScreen from 'screens/ProfileScreen';
import HomeScreen from 'screens/HomeScreen';
import { supabase } from 'lib/supabase';
import { subscribeToAuthChanges } from 'features/auth/session';

export type RootStackParamList = {
	Welcome: undefined;
	Profile: { userName: string };
	Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	const navigationRef = useMemo(() => createNavigationContainerRef<RootStackParamList>(), []);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let unsub: (() => void) | undefined;
		(async () => {
			const { data } = await supabase.auth.getSession();
			const authed = !!data.session;
			setIsAuthenticated(authed);
			setIsReady(true);
			
			unsub = subscribeToAuthChanges(async () => {
				const { data: s } = await supabase.auth.getSession();
				const authed = !!s.session;
				setIsAuthenticated(authed);
				
				if (navigationRef.isReady()) {
					if (authed) {
						// After login, go to Profile
						// Fetch user name from profile
						const { data: { user } } = await supabase.auth.getUser();
						let userName = 'User';
						if (user) {
							const { data: profile } = await supabase
								.from('profiles')
								.select('full_name')
								.eq('id', user.id)
								.single();
							if (profile?.full_name) {
								userName = profile.full_name;
							}
						}
						navigationRef.reset({
							index: 0,
							routes: [{ name: 'Profile', params: { userName } }],
						});
					} else {
						// After logout, go to Welcome
						navigationRef.reset({
							index: 0,
							routes: [{ name: 'Welcome' }],
						});
					}
				}
			});
		})();
		return () => {
			if (unsub) unsub();
		};
	}, [navigationRef]);

	return (
		<NavigationContainer ref={navigationRef}>
			<Stack.Navigator initialRouteName={isAuthenticated ? 'Profile' : 'Welcome'}>
				<Stack.Screen name="Welcome" component={WelcomeScreen} />
				<Stack.Screen name="Profile" component={ProfileScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}


