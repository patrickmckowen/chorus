import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppleAuthenticationButton, AppleAuthenticationButtonStyle, AppleAuthenticationButtonType } from 'expo-apple-authentication';

export default function WelcomeScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Chorus</Text>
				<View style={styles.buttonContainer}>
					<AppleAuthenticationButton
						buttonType={AppleAuthenticationButtonType.SIGN_IN}
						buttonStyle={AppleAuthenticationButtonStyle.BLACK}
						cornerRadius={8}
						style={styles.button}
						onPress={() => {}}
					/>
				</View>
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

