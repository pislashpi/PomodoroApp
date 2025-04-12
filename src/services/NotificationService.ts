import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SessionType } from '../store/timerStore'; // SessionType をインポート

// --- 通知ハンドラの設定 ---
// アプリがフォアグラウンドで動作中に通知を受け取ったときの動作を設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // アラートを表示
    shouldPlaySound: true, // サウンドを再生（カスタムサウンドは別途設定必要）
    shouldSetBadge: false, // バッジ数はここでは変更しない
  }),
});
// ------------------------

/**
 * 通知の許可をユーザーに要求します。
 * @returns 許可されたかどうか (boolean)
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status (iOS):', status);
    return status === 'granted';
  } else {
    // Android はデフォルトで許可されている場合が多いが、念のため確認
     const { status } = await Notifications.getPermissionsAsync();
     console.log('Notification permission status (Android):', status);
     return status === 'granted';
     // Android 13以降は明示的な許可要求が必要になる場合がある
     // const { status } = await Notifications.requestPermissionsAsync();
     // return status === 'granted';
  }
   return false; // デフォルトは false
};

/**
 * 指定された秒数後に通知をスケジュールします。
 * @param seconds - 通知をスケジュールするまでの秒数
 * @param sessionType - 完了したセッションの種類
 * @param notificationSound - 使用する通知音 (iOS システムサウンド名 or null/default)
 */
export const scheduleNotification = async (
  seconds: number,
  sessionType: SessionType,
  notificationSound?: string | null // オプションでサウンド指定
) => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pomodoro Complete!",
        body: `${sessionType} session has finished.`,
        sound: notificationSound === 'default' || !notificationSound ? true : notificationSound, // 'default' or true でデフォルトサウンド、指定があればその名前
         // data: { type: 'pomodoro_complete', session: sessionType }, // 通知データ（タップ時の処理用など）
      },
      trigger: {
        seconds: Math.max(1, seconds), // 0秒後は即時通知になるため最低1秒
      } as any, // 型エラー回避のため一時的に any を使用
    });
    console.log(`Notification scheduled (${sessionType}, ID: ${identifier}) after ${seconds} seconds.`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * スケジュールされているすべての通知をキャンセルします。
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled.');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

// --- アプリ起動時に権限を確認・要求 (オプション) ---
// App.tsx などで実行するのが一般的
// requestNotificationPermissions();
// ---------------------------------------------------- 