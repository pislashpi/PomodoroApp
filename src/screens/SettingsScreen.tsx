import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  Button,
  ScrollView,
  Linking,
} from 'react-native';
import { useTimerStore } from '../store/timerStore';

const SettingsScreen = () => {
  const { settings, updateSettings } = useTimerStore();

  // 数値入力のハンドラ（分単位を想定）
  const handleDurationChange = (key: keyof typeof settings, value: string) => {
    const duration = parseInt(value, 10);
    if (!isNaN(duration) && duration > 0) {
      updateSettings({ [key]: duration });
    } else if (value === '') { // 空文字の場合も許容（入力途中）
      updateSettings({ [key]: 0 }); // 一時的に0 or 最後の有効値保持？ 要検討
    }
    // 不正値の場合は更新しないか、アラートを出すか？
  };

  // セット数のハンドラ
  const handleSetsChange = (value: string) => {
    const sets = parseInt(value, 10);
    if (!isNaN(sets) && sets > 0) {
      updateSettings({ setsBeforeLongBreak: sets });
    } else if (value === '') {
      updateSettings({ setsBeforeLongBreak: 0 });
    }
  };

  // TODO: iOS システムサウンド選択の実装
  const handleSelectNotificationSound = () => {
    console.log('Select Notification Sound (Not Implemented)');
    // ここで iOS ネイティブのサウンドピッカーを呼び出すか、
    // expo-notifications で利用可能なサウンドリストを表示する
  };

  // TODO: バンドルしたホワイトノイズ選択の実装
  const handleSelectWhiteNoise = () => {
    console.log('Select White Noise (Not Implemented)');
    // ここで選択肢（例: 'Rain', 'Ocean'）を表示する Picker などを実装
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Time & Cycle</Text>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Focus Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.focusDuration)}
          onChangeText={(text) => handleDurationChange('focusDuration', text)}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Short Break Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.shortBreakDuration)}
          onChangeText={(text) => handleDurationChange('shortBreakDuration', text)}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Long Break Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.longBreakDuration)}
          onChangeText={(text) => handleDurationChange('longBreakDuration', text)}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Sets Before Long Break</Text>
        <TextInput
          style={styles.input}
          value={String(settings.setsBeforeLongBreak)}
          onChangeText={handleSetsChange}
          keyboardType="number-pad"
        />
      </View>

      <Text style={styles.sectionTitle}>Device</Text>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Prevent Screen Sleep</Text>
        <Switch
          value={settings.preventScreenSleep}
          onValueChange={(value) => updateSettings({ preventScreenSleep: value })}
        />
      </View>

      <Text style={styles.sectionTitle}>Sounds</Text>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Enable Notifications</Text>
        <Switch
          value={settings.enableNotifications}
          onValueChange={(value) => updateSettings({ enableNotifications: value })}
        />
      </View>
      {/* <View style={styles.settingItem}>
        <Text style={styles.label}>Notification Sound</Text>
        <Button title="Select Sound" onPress={handleSelectNotificationSound} disabled={!settings.enableNotifications} />
         <Text>Current: {settings.notificationSound}</Text>
      </View> */}

      <View style={styles.settingItem}>
        <Text style={styles.label}>Enable White Noise</Text>
        <Switch
          value={settings.enableWhiteNoise}
          onValueChange={(value) => updateSettings({ enableWhiteNoise: value })}
        />
      </View>
      {/* <View style={styles.settingItem}>
        <Text style={styles.label}>White Noise Track</Text>
        <Button title="Select Track" onPress={handleSelectWhiteNoise} disabled={!settings.enableWhiteNoise} />
         <Text>Current: {settings.whiteNoiseSound}</Text>
      </View> */}

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.infoLinkContainer}>
        <Button
          title="Author's Website"
          onPress={() => openLink('https://example.com')}
        />
        <Button
          title="Support on Ko-fi"
          onPress={() => openLink('https://ko-fi.com/yourname')}
        />
        {/* 他のリンクも追加 */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  label: {
    fontSize: 16,
    flex: 1, // ラベルが長い場合に対応
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    width: 80, // 幅を固定
    textAlign: 'right',
    fontSize: 16,
    marginLeft: 10, // ラベルとの間隔
  },
  infoLinkContainer: {
    marginTop: 20,
    alignItems: 'flex-start', // 左寄せにする場合
  },
});

export default SettingsScreen; 