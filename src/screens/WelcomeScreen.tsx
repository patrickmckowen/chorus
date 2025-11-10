import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AppleAuthenticationButton, AppleAuthenticationButtonStyle, AppleAuthenticationButtonType } from 'expo-apple-authentication';
import { RootStackParamList } from 'navigation';
import { supabase } from 'lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
	const navigation = useNavigation<NavigationProp>();
	const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

	useEffect(() => {
		AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
	}, []);

	const handleSignIn = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});

			if (!credential.identityToken) {
				throw new Error('No Apple identityToken');
			}

			const { data, error } = await supabase.auth.signInWithIdToken({
				provider: 'apple',
				token: credential.identityToken,
			});
			if (error) throw error;

			const user = data.user;

			const fullNameStr = `${credential.fullName?.givenName ?? ''} ${credential.fullName?.familyName ?? ''}`.trim();
			if (fullNameStr) {
				await supabase.from('profiles').upsert({ id: user.id, full_name: fullNameStr });
			}

			const userName = fullNameStr || 'User';

			navigation.navigate('Profile', { userName });
		} catch (e) {
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_CANCELED') {
				// User canceled, do nothing
				return;
			}
			Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Chorus</Text>
				{isAppleAuthAvailable && (
					<View style={styles.buttonContainer}>
						<AppleAuthenticationButton
							buttonType={AppleAuthenticationButtonType.SIGN_IN}
							buttonStyle={AppleAuthenticationButtonStyle.BLACK}
							cornerRadius={8}
							style={styles.button}
							onPress={handleSignIn}
						/>
					</View>
				)}
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
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 48,
	},
	title: {
		fontSize: 34,
		fontWeight: '800',
	},
	buttonContainer: {
		alignItems: 'center',
	},
	button: {
		width: '100%',
		height: 50,
	},
});

