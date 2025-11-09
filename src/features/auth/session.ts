import { AppState } from 'react-native';
import { supabase } from 'lib/supabase';

export function subscribeToAuthChanges(onChange: () => void) {
	const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => onChange());
	const appSub = AppState.addEventListener('change', async (state) => {
		if (state === 'active') {
			await supabase.auth.startAutoRefresh();
		} else {
			await supabase.auth.stopAutoRefresh();
		}
	});
	return () => {
		sub.subscription.unsubscribe();
		appSub.remove();
	};
}


