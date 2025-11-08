/**
 * Profile screen for displaying Apple Music authorization and recently played tracks
 */

import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	ScrollView,
	View,
	Text,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	RefreshControl,
} from 'react-native';
import { useAppleMusicAuth } from 'hooks/useAppleMusicAuth';
import { AppleMusicClient, TrackActivity } from 'services/apple-music';

export default function ProfileScreen() {
	const {
		auth,
		isAuthorized,
		isInitializing,
		isAuthorizing,
		error: authError,
		authorize,
		clearAuth,
	} = useAppleMusicAuth();

	const [client, setClient] = useState<AppleMusicClient | null>(null);
	const [tracks, setTracks] = useState<TrackActivity[]>([]);
	const [isLoadingTracks, setIsLoadingTracks] = useState(false);
	const [tracksError, setTracksError] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Initialize client when auth is ready and authorized
	useEffect(() => {
		if (auth && isAuthorized && !client) {
			const clientInstance = new AppleMusicClient(auth);
			setClient(clientInstance);
		}
	}, [auth, isAuthorized, client]);

	// Fetch tracks when client is ready
	useEffect(() => {
		if (client && isAuthorized && tracks.length === 0 && !isLoadingTracks) {
			fetchRecentlyPlayedTracks();
		}
	}, [client, isAuthorized]);

	/**
	 * Fetch recently played tracks
	 */
	const fetchRecentlyPlayedTracks = async () => {
		if (!client) {
			return;
		}

		try {
			setIsLoadingTracks(true);
			setTracksError(null);

			const recentTracks = await client.getRecentlyPlayedTracks(25);
			setTracks(recentTracks);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch recently played tracks';
			setTracksError(errorMessage);
			console.error('Failed to fetch tracks:', error);
		} finally {
			setIsLoadingTracks(false);
		}
	};

	/**
	 * Handle connect Apple Music button press
	 */
	const handleConnectAppleMusic = async () => {
		try {
			await authorize();
		} catch (error) {
			console.error('Failed to authorize:', error);
		}
	};

	/**
	 * Handle disconnect
	 */
	const handleDisconnect = async () => {
		await clearAuth();
		setClient(null);
		setTracks([]);
		setTracksError(null);
	};

	/**
	 * Handle refresh
	 */
	const handleRefresh = async () => {
		setIsRefreshing(true);
		await fetchRecentlyPlayedTracks();
		setIsRefreshing(false);
	};

	/**
	 * Format timestamp to readable date
	 */
	const formatTimestamp = (timestamp: number): string => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) {
			return 'Just now';
		} else if (diffMins < 60) {
			return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else if (diffDays < 7) {
			return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		} else {
			return date.toLocaleDateString();
		}
	};

	if (isInitializing) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#000000" />
					<Text style={styles.loadingText}>Initializing...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				refreshControl={
					isAuthorized ? (
						<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
					) : undefined
				}
			>
				<View style={styles.content}>
					<Text style={styles.title}>Profile</Text>

					{/* Authorization Section */}
					<View style={styles.section}>
						{!isAuthorized ? (
							<View style={styles.authSection}>
								<Text style={styles.sectionTitle}>Connect Apple Music</Text>
								<Text style={styles.sectionDescription}>
									Connect your Apple Music account to see your recently played tracks.
								</Text>

								{authError && (
									<View style={styles.errorContainer}>
										<Text style={styles.errorText}>{authError}</Text>
									</View>
								)}

								<TouchableOpacity
									style={[styles.button, isAuthorizing && styles.buttonDisabled]}
									onPress={handleConnectAppleMusic}
									disabled={isAuthorizing}
								>
									{isAuthorizing ? (
										<ActivityIndicator size="small" color="#ffffff" />
									) : (
										<Text style={styles.buttonText}>Connect Apple Music</Text>
									)}
								</TouchableOpacity>
							</View>
						) : (
							<View style={styles.authSection}>
								<View style={styles.connectedHeader}>
									<Text style={styles.sectionTitle}>Apple Music Connected</Text>
									<TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
										<Text style={styles.disconnectText}>Disconnect</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>

					{/* Tracks Section */}
					{isAuthorized && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Recently Played</Text>

							{isLoadingTracks && tracks.length === 0 ? (
								<View style={styles.centerContent}>
									<ActivityIndicator size="large" color="#000000" />
									<Text style={styles.loadingText}>Loading tracks...</Text>
								</View>
							) : tracksError ? (
								<View style={styles.errorContainer}>
									<Text style={styles.errorText}>{tracksError}</Text>
									<TouchableOpacity
										style={[styles.button, styles.retryButton]}
										onPress={fetchRecentlyPlayedTracks}
									>
										<Text style={styles.buttonText}>Retry</Text>
									</TouchableOpacity>
								</View>
							) : tracks.length === 0 ? (
								<View style={styles.emptyContainer}>
									<Text style={styles.emptyText}>No recently played tracks found.</Text>
								</View>
							) : (
								<View style={styles.tracksList}>
									{tracks.map((track) => (
										<View key={track.id} style={styles.trackItem}>
											{track.albumArtUrl ? (
												<Image source={{ uri: track.albumArtUrl }} style={styles.albumArt} />
											) : (
												<View style={[styles.albumArt, styles.albumArtPlaceholder]}>
													<Text style={styles.albumArtPlaceholderText}>🎵</Text>
												</View>
											)}
											<View style={styles.trackInfo}>
												<Text style={styles.trackName} numberOfLines={1}>
													{track.trackName}
												</Text>
												<Text style={styles.artistName} numberOfLines={1}>
													{track.artistName}
												</Text>
												<Text style={styles.timestamp}>{formatTimestamp(track.timestamp)}</Text>
											</View>
										</View>
									))}
								</View>
							)}
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 24,
	},
	title: {
		fontSize: 34,
		fontWeight: '800',
		marginBottom: 24,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 12,
	},
	sectionDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
	},
	authSection: {
		backgroundColor: '#f2f2f7',
		borderRadius: 16,
		padding: 20,
	},
	connectedHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	button: {
		backgroundColor: '#000000',
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 48,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 16,
	},
	retryButton: {
		marginTop: 12,
		backgroundColor: '#007AFF',
	},
	disconnectButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	disconnectText: {
		color: '#FF3B30',
		fontWeight: '600',
		fontSize: 14,
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: '#666',
	},
	errorContainer: {
		backgroundColor: '#FFEBEE',
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
	},
	errorText: {
		color: '#C62828',
		fontSize: 14,
	},
	emptyContainer: {
		paddingVertical: 40,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 14,
		color: '#666',
	},
	tracksList: {
		gap: 12,
	},
	trackItem: {
		flexDirection: 'row',
		backgroundColor: '#f2f2f7',
		borderRadius: 12,
		padding: 12,
		alignItems: 'center',
	},
	albumArt: {
		width: 60,
		height: 60,
		borderRadius: 8,
		backgroundColor: '#e0e0e0',
	},
	albumArtPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	albumArtPlaceholderText: {
		fontSize: 24,
	},
	trackInfo: {
		flex: 1,
		marginLeft: 12,
	},
	trackName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	artistName: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
	},
	timestamp: {
		fontSize: 12,
		color: '#999',
	},
});

