import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import DeviceInfoScreen from '../screens/DeviceInfoScreen';
import DisplayTestScreen from '../screens/DisplayTestScreen';
import TouchTestScreen from '../screens/TouchTestScreen';
import AudioTestScreen from '../screens/AudioTestScreen';
import CameraTestScreen from '../screens/CameraTestScreen';
import ConnectivityTestScreen from '../screens/ConnectivityTestScreen';
import SensorTestScreen from '../screens/SensorTestScreen';
import BatteryTestScreen from '../screens/BatteryTestScreen';
import ButtonTestScreen from '../screens/ButtonTestScreen';
import PerformanceTestScreen from '../screens/PerformanceTestScreen';
import SecurityCheckScreen from '../screens/SecurityCheckScreen';
import FinalReportScreen from '../screens/FinalReportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="DeviceInfo" component={DeviceInfoScreen} />
      <Stack.Screen name="DisplayTest" component={DisplayTestScreen} />
      <Stack.Screen name="TouchTest" component={TouchTestScreen} />
      <Stack.Screen name="AudioTest" component={AudioTestScreen} />
      <Stack.Screen name="CameraTest" component={CameraTestScreen} />
      <Stack.Screen name="ConnectivityTest" component={ConnectivityTestScreen} />
      <Stack.Screen name="SensorTest" component={SensorTestScreen} />
      <Stack.Screen name="BatteryTest" component={BatteryTestScreen} />
      <Stack.Screen name="ButtonTest" component={ButtonTestScreen} />
      <Stack.Screen name="PerformanceTest" component={PerformanceTestScreen} />
      <Stack.Screen name="SecurityCheck" component={SecurityCheckScreen} />
      <Stack.Screen name="FinalReport" component={FinalReportScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
