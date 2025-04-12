import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useKeepAwake } from 'expo-keep-awake';
import { useTimerStore } from './src/store/timerStore';

const KeepAwakeManager = () => {
  const isActive = useTimerStore((state) => state.isActive);
  const preventScreenSleep = useTimerStore((state) => state.settings.preventScreenSleep);

  if (isActive && preventScreenSleep) {
    useKeepAwake();
  }

  return null;
};

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <KeepAwakeManager />
      <AppNavigator />
    </>
  );
}
