import React from 'react';
import { SafeAreaView } from 'react-native';
import RootNavigator from 'navigation';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RootNavigator />
    </SafeAreaView>
  );
}
