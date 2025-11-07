import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen', () => {
	it('renders title', () => {
		render(<HomeScreen />);
		expect(screen.getByText('Chorus')).toBeTruthy();
	});
});

