import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useState } from 'react';

export default function Index() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		(async () => {
			const { data } = await supabase.auth.getSession();
			setIsAuthenticated(!!data.session);
		})();
	}, []);

	if (isAuthenticated === null) {
		return null;
	}

	if (isAuthenticated) {
		return <Redirect href="/(tabs)/profile" />;
	}

	return <Redirect href="/(auth)/welcome" />;
}

