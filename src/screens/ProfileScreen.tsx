import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from 'navigation';
import { supabase } from 'lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ route }: Props) {
	const { userName } = route.params;
	const navigation = useNavigation();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [currentUserName, setCurrentUserName] = useState(userName);

	// Fetch current user profile from Supabase
	useEffect(() => {
		const fetchUserProfile = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('full_name')
					.eq('id', user.id)
					.single();
				
				if (profile?.full_name) {
					setCurrentUserName(profile.full_name);
				}
			}
		};
		fetchUserProfile();
	}, []);

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error('Logout error:', error);
				Alert.alert('Error', 'Failed to log out. Please try again.');
				setIsLoggingOut(false);
				return;
			}
			// Navigate immediately after successful signOut
			// Subscription in RootNavigator will also handle this as backup
			navigation.reset({
				index: 0,
				routes: [{ name: 'Welcome' as never }],
			});
			setIsLoggingOut(false);
		} catch (error) {
			console.error('Logout exception:', error);
			Alert.alert('Error', 'An unexpected error occurred. Please try again.');
			setIsLoggingOut(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>{currentUserName}</Text>
				<View style={styles.spacer} />
				<TouchableOpacity
					onPress={handleLogout}
					style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
					disabled={isLoggingOut}
				>
					{isLoggingOut ? (
						<ActivityIndicator color="#000" />
					) : (
						<Text style={styles.logoutText}>Log out</Text>
					)}
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	title: {
		fontSize: 34,
		fontWeight: '800',
	},
	spacer: {
		flex: 1,
	},
	logoutButton: {
		backgroundColor: '#f2f2f7',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 16,
	},
	logoutButtonDisabled: {
		opacity: 0.6,
	},
	logoutText: {
		fontWeight: '700',
	},
});

