import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function HomeScreen() {
	const opacity = useSharedValue(0);
	const cardScale = useSharedValue(0.95);
	const cardOpacity = useSharedValue(0);

	useEffect(() => {
		opacity.value = withTiming(1, { duration: 600 });
		cardScale.value = withTiming(1, { duration: 500 });
		cardOpacity.value = withTiming(1, { duration: 500 });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const animatedStyle = useAnimatedStyle(() => {
		return { opacity: opacity.value };
	}, []);

	const cardAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: cardOpacity.value,
			transform: [{ scale: cardScale.value }],
		};
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<Animated.View style={[styles.content, animatedStyle]}>
				<View style={styles.header}>
					<Text style={styles.title}>Chorus</Text>
				</View>

				<View style={styles.buttonRow}>
					<TouchableOpacity onPress={() => {}} style={styles.spotifyButton}>
						<Text style={styles.buttonText}>Connect Spotify</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => {}} style={styles.appleButton}>
						<Text style={styles.buttonText}>Connect Apple Music</Text>
					</TouchableOpacity>
				</View>

				<Animated.View style={[styles.card, cardAnimatedStyle]}>
					<Text style={styles.cardTitle}>Welcome</Text>
					<Text style={styles.cardText}>
						This is a sample animated card powered by Fabric + Reanimated 4.
					</Text>
				</Animated.View>
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
	},
	header: {
		paddingTop: 24,
		paddingBottom: 16,
	},
	title: {
		fontSize: 34,
		fontWeight: '800',
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
	},
	spotifyButton: {
		backgroundColor: '#1DB954',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
	},
	appleButton: {
		backgroundColor: '#000000',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
	},
	buttonText: {
		color: 'white',
		fontWeight: '700',
	},
	card: {
		marginTop: 24,
		borderRadius: 16,
		backgroundColor: '#f2f2f7',
		padding: 20,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	cardText: {
		color: '#555',
	},
});


