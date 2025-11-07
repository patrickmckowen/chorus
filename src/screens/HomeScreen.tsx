import React, { useEffect } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function HomeScreen() {
	const opacity = useSharedValue(0);

	useEffect(() => {
		opacity.value = withTiming(1, { duration: 600 });
	}, [opacity]);

	const animatedStyle = useAnimatedStyle(() => {
		return { opacity: opacity.value };
	}, []);

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
				<Text style={{ fontSize: 28, fontWeight: '700' }}>Chorus</Text>
			</Animated.View>
		</SafeAreaView>
	);
}


