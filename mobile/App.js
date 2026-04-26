import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import appCheck from '@react-native-firebase/app-check';

// Initialize App Check
const rnAppCheck = appCheck();
rnAppCheck.activate('playIntegrity', true);

// Global error tracking for unhandled rejections
if (!__DEV__) {
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Fatal Error:', error);
    // You could also log to your own service here
    originalErrorHandler(error, isFatal);
  });
}

import { checkLastStep } from './src/utils/forensics';

export default function App() {
  React.useEffect(() => {
    checkLastStep();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
