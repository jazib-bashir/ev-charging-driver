import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isExpoGoAndroid(): boolean {
  return isExpoGo() && Platform.OS === 'android';
}
