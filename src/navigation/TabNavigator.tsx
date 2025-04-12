import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TimerScreen from '../screens/TimerScreen';
import LogScreen from '../screens/LogScreen';
import SettingsScreen from '../screens/SettingsScreen';
// Expo Vector Iconsなどを後で追加してアイコンを設定することを想定
// import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ここでアイコンを設定できます。例:
        // tabBarIcon: ({ focused, color, size }) => {
        //   let iconName;
        //   if (route.name === 'Timer') {
        //     iconName = focused ? 'timer' : 'timer-outline';
        //   } else if (route.name === 'Log') {
        //     iconName = focused ? 'list' : 'list-outline';
        //   } else if (route.name === 'Settings') {
        //     iconName = focused ? 'settings' : 'settings-outline';
        //   }
        //   // You can return any component that you like here!
        //   return <Ionicons name={iconName as any} size={size} color={color} />;
        // },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: true, // 各画面にヘッダーを表示（必要に応じて false に変更）
      })}
    >
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator; 