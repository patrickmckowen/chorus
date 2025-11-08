import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from 'screens/WelcomeScreen';
import ProfileScreen from 'screens/ProfileScreen';
import HomeScreen from 'screens/HomeScreen';

export type RootStackParamList = {
	Welcome: undefined;
	Profile: { userName: string };
	Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Welcome">
				<Stack.Screen name="Welcome" component={WelcomeScreen} />
				<Stack.Screen name="Profile" component={ProfileScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}


