import { supabase } from 'lib/supabase';

export function subscribeToAuthChanges(onChange: () => void) {
	const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => onChange());
	return () => {
		sub.subscription.unsubscribe();
	};
}

