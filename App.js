import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuroraProvider, useAurora } from './src/context/AuroraContext';
import RoomScreen from './src/screens/RoomScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

function AppContent() {
  const { onboardingComplete } = useAurora();
  return onboardingComplete ? <RoomScreen /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuroraProvider>
          <StatusBar style="light" />
          <AppContent />
        </AuroraProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});