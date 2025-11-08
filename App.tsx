import React from 'react';
import { SafeAreaView } from 'react-native';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RootNavigator />
    </SafeAreaView>
  );
}
