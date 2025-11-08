import React, { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type RootStackParamList = {
	Home: undefined;
	Profile: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
	const navigation = useNavigation<HomeScreenNavigationProp>();
	const opacity = useSharedValue(0);
	const cardScale = useSharedValue(0.95);
	const cardOpacity = useSharedValue(0);

	useEffect(() => {
		opacity.value = withTiming(1, { duration: 600 });
		cardScale.value = withTiming(1, { duration: 500 });
		cardOpacity.value = withTiming(1, { duration: 500 });
	}, [opacity]);

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
		<SafeAreaView style={{ flex: 1 }}>
			<Animated.View style={[{ flex: 1, paddingHorizontal: 24 }, animatedStyle]}>
				<View style={{ paddingTop: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
					<Text style={{ fontSize: 34, fontWeight: '800' }}>Chorus</Text>
					<TouchableOpacity
						onPress={() => navigation.navigate('Profile')}
						style={{
							paddingHorizontal: 12,
							paddingVertical: 8,
						}}
					>
						<Text style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>Profile</Text>
					</TouchableOpacity>
				</View>

				<View style={{ flexDirection: 'row', gap: 12 }}>
					<TouchableOpacity
						onPress={() => {}}
						style={{
							backgroundColor: '#1DB954',
							paddingHorizontal: 16,
							paddingVertical: 12,
							borderRadius: 12,
						}}
					>
						<Text style={{ color: 'white', fontWeight: '700' }}>Connect Spotify</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => navigation.navigate('Profile')}
						style={{
							backgroundColor: '#000000',
							paddingHorizontal: 16,
							paddingVertical: 12,
							borderRadius: 12,
						}}
					>
						<Text style={{ color: 'white', fontWeight: '700' }}>Connect Apple Music</Text>
					</TouchableOpacity>
				</View>

				<Animated.View
					style={[
						{
							marginTop: 24,
							borderRadius: 16,
							backgroundColor: '#f2f2f7',
							padding: 20,
						},
						cardAnimatedStyle,
					]}
				>
					<Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Welcome</Text>
					<Text style={{ color: '#555' }}>
						This is a sample animated card powered by Fabric + Reanimated 4.
					</Text>
				</Animated.View>
			</Animated.View>
		</SafeAreaView>
	);
}


