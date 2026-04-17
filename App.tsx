import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { DiagnosticProvider } from './src/store/DiagnosticContext';

function App() {
  return (
    <SafeAreaProvider>
      <DiagnosticProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <AppNavigator />
        </NavigationContainer>
      </DiagnosticProvider>
    </SafeAreaProvider>
  );
}

export default App;
