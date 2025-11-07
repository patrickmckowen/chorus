import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text style={{ fontSize: 28, fontWeight: '700' }}>Chorus</Text>
			</View>
		</SafeAreaView>
	);
}


