import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useTimerStore, SessionType } from '../store/timerStore';
import {
  requestNotificationPermissions,
  scheduleNotification,
  cancelAllNotifications,
} from '../services/NotificationService';
import { playSound, pauseSound, stopSound } from '../services/AudioService';

// ホワイトノイズファイルの参照（TimerScreenから移動 or 共有化）
const whiteNoiseSounds = {
  // rain: require('../../assets/sounds/rain.mp3'), // TODO: ファイル配置とパス設定
  // waves: require('../../assets/sounds/waves.mp3'),
};

export const useTimer = () => {
  const {
    remainingTime,
    isActive,
    isPaused,
    sessionType,
    currentSet,
    settings,
    tick,
    setSessionType,
    resetTimerForSession,
    incrementSet,
    resetSets,
    totalSetsGoal,
    setTotalSetsGoal,
  } = useTimerStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [scheduledNotificationId, setScheduledNotificationId] =
    useState<string | null>(null);

  // --- Helper: Get Noise Path ---
  const getNoisePath = () => {
    // const selectedNoiseKey = settings.whiteNoiseSound as keyof typeof whiteNoiseSounds; // ストアから取得する想定
    const selectedNoiseKey = 'rain'; // 仮
    const key = selectedNoiseKey as keyof typeof whiteNoiseSounds; // 型アサーション
    if (key in whiteNoiseSounds) {
      return whiteNoiseSounds[key];
    }
    // console.warn(`Noise key "${selectedNoiseKey}" not found.`); // 頻繁に出るためコメントアウト推奨
    return null;
  };

  // --- タイマーのインターバル処理 ---
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, tick]);

  // --- 残り時間が0になった時の処理 (通知はスケジュール済みなので、ここでは状態遷移のみ) ---
  useEffect(() => {
    if (remainingTime === 0 && isActive) {
      // 注意: 通知はタイマー開始/再開時にスケジュールされる
      // ここではセッション完了後の状態遷移のみを行う
      console.log('Timer reached 0, handling session completion...');
      handleSessionCompletion();
    }
  }, [remainingTime, isActive]); // isActive を依存配列に追加

  // --- セッション完了処理 (修正) ---
  const handleSessionCompletion = async () => { // async に変更
    // stopSound(); // stopTimer 内で処理されるので不要かも

    let nextSessionType: SessionType;
    let shouldIncrementSet = false;

    if (sessionType === 'Focus') {
      shouldIncrementSet = true;
      if (currentSet >= settings.setsBeforeLongBreak) {
        nextSessionType = 'Long Break';
        resetSets();
      } else {
        nextSessionType = 'Short Break';
      }
    } else {
      nextSessionType = 'Focus';
    }

    // 次のセッションタイプと時間を設定 (isActive は false になる)
    setSessionType(nextSessionType);
    resetTimerForSession(nextSessionType);

    // Focus完了時のみセット数をインクリメント
    if (shouldIncrementSet && nextSessionType !== 'Long Break') {
      incrementSet();
    }

    // --- 自動開始処理を追加 ---
    console.log(`[Timer Action] Automatically starting next session: ${nextSessionType}`);
    // ストアの状態が更新されるのを待つため、わずかな遅延を入れるか、
    // start() 内で最新の状態を取得するようにする。
    // start() はストアから最新の状態を取得するので、おそらく遅延は不要。
    await start(); // 次のタイマーを自動的に開始
    // -----------------------
  };

  // --- タイマー制御ラッパー関数 (修正) ---
  const start = async () => {
    console.log('Starting timer...');
    await cancelAllNotifications(); // 開始前にキャンセル
    setScheduledNotificationId(null); // IDもクリア
    console.log('[Timer Action] Cancelled all previous notifications.');

    useTimerStore.getState().startTimer();
    const currentRemainingTime = useTimerStore.getState().remainingTime;
    console.log(`[Timer Action] Scheduling notification for ${sessionType} in ${currentRemainingTime} seconds.`); // ログ追加

    if (settings.enableNotifications && currentRemainingTime > 0) {
      const notificationId = await scheduleNotification(
        currentRemainingTime,
        sessionType
        // settings.notificationSound
      );
      if (notificationId) {
           console.log(`[Timer Action] Scheduled notification ID: ${notificationId}`); // ログ追加
          setScheduledNotificationId(notificationId);
      } else {
          console.warn('[Timer Action] Failed to schedule notification.');
      }
    }

    if (sessionType === 'Focus' && settings.enableWhiteNoise) {
      const noisePath = getNoisePath();
      if (noisePath) {
        await playSound(noisePath);
      }
    }
  };

  const pause = async () => {
    console.log('Pausing timer...');
    useTimerStore.getState().pauseTimer();
    if (scheduledNotificationId) {
      console.log(`[Timer Action] Attempting to cancel notification ID: ${scheduledNotificationId}`); // ログ追加
      await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
      console.log(`[Timer Action] Cancelled scheduled notification: ${scheduledNotificationId}`);
      setScheduledNotificationId(null);
    } else {
      console.log('[Timer Action] No specific notification ID found. Cancelling all.'); // ログ追加
      await cancelAllNotifications(); // ID がなければ念のため全てキャンセル
    }
    await pauseSound();
  };

  const resume = async () => {
    console.log('Resuming timer...');
    // 再開前にも既存の通知をキャンセル（Pauseでキャンセルされているはずだが念のため）
    await cancelAllNotifications();
    setScheduledNotificationId(null);
    console.log('[Timer Action] Cancelled notifications before resuming.');

    useTimerStore.getState().resumeTimer();
    const currentRemainingTime = useTimerStore.getState().remainingTime;
    console.log(`[Timer Action] Rescheduling notification for ${sessionType} in ${currentRemainingTime} seconds.`); // ログ追加

    if (settings.enableNotifications && currentRemainingTime > 0) {
      const notificationId = await scheduleNotification(
        currentRemainingTime,
        sessionType
        // settings.notificationSound
      );
       if (notificationId) {
           console.log(`[Timer Action] Rescheduled notification ID: ${notificationId}`); // ログ追加
          setScheduledNotificationId(notificationId);
       } else {
           console.warn('[Timer Action] Failed to reschedule notification.');
       }
    }

    if (sessionType === 'Focus' && settings.enableWhiteNoise) {
      const noisePath = getNoisePath();
      if (noisePath) {
        await playSound(noisePath);
      }
    }
  };

  const stop = async () => {
    console.log('Stopping timer...');
    useTimerStore.getState().stopTimer();
    console.log('[Timer Action] Cancelling all notifications on stop.'); // ログ追加
    await cancelAllNotifications();
    setScheduledNotificationId(null);
    await stopSound();
  };

  // --- 初期化処理 (通知権限要求) ---
  useEffect(() => {
    requestNotificationPermissions(); // NotificationService からインポート
  }, []);

  return {
    remainingTime,
    sessionType,
    isActive,
    isPaused,
    currentSet,
    totalSetsGoal,
    settings,
    startTimer: start,
    pauseTimer: pause,
    resumeTimer: resume,
    stopTimer: stop,
    setTotalSetsGoal,
  };
}; 