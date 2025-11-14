import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/home';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'chorus://oauthredirect'),
  AuthRequest: jest.fn(),
  ResponseType: { Code: 'code' },
  CodeChallengeMethod: { S256: 'S256' },
}));

jest.mock('../../lib/config', () => ({
  appConfig: {
    apiUrl: 'https://example.com',
    spotify: { clientId: 'test-client-id' },
    appleMusic: { developerToken: 'test-token' },
  },
}));

describe('HomeScreen', () => {
  it('renders title', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Chorus')).toBeTruthy();
  });
});
