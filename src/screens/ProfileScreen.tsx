import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from 'navigation';
import { supabase } from 'lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ route }: Props) {
	const { userName } = route.params;
	const navigation = useNavigation();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>{userName}</Text>
				<View style={styles.spacer} />
				<TouchableOpacity
					onPress={async () => {
						await supabase.auth.signOut();
						// Navigation reset is handled by auth subscription in RootNavigator
						navigation.navigate('Welcome' as never);
					}}
					style={styles.logoutButton}
				>
					<Text style={styles.logoutText}>Log out</Text>
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
	logoutText: {
		fontWeight: '700',
	},
});

