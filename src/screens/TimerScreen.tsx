import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import { useTimer } from '../hooks/useTimer';
import { formatTime } from '../utils/formatTime';
import { useTimerStore } from '../store/timerStore'; // ストアから設定を取得するため
import { playSound, pauseSound, stopSound } from '../services/AudioService';
// import NoiseControls from '../components/NoiseControls'; // 後で実装

// --- ホワイトノイズ設定 ---
// SettingsScreen で選択された値に応じて変更する想定
// ここでは仮に固定のファイルパスを使用
const whiteNoiseSounds = {
  // rain: require('../../assets/sounds/rain.mp3'), // TODO: ファイルパスを正しく設定 & ファイル配置
  // waves: require('../../assets/sounds/waves.mp3'), // TODO: ファイルパスを正しく設定 & ファイル配置
  // 他のサウンドも追加可能
};
// --------------------------

const TimerScreen = () => {
  const {
    remainingTime,
    sessionType,
    isActive,
    isPaused,
    currentSet,
    totalSetsGoal,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setTotalSetsGoal,
  } = useTimer();

  // ストアからホワイトノイズ設定を取得
  const enableWhiteNoise = useTimerStore(
    (state) => state.settings.enableWhiteNoise
  );
  // const selectedNoise = useTimerStore((state) => state.settings.whiteNoiseSound); // TODO: ストアに whiteNoiseSound を追加
  const selectedNoiseKey = 'rain'; // 仮の選択キー

  const [goalInput, setGoalInput] = useState<string>(String(totalSetsGoal));
  const [showGoalInput, setShowGoalInput] = useState<boolean>(true); // 初回表示時など
  const [isNoiseManuallyPaused, setIsNoiseManuallyPaused] =
    useState<boolean>(false); // 手動での一時停止状態

  // --- ホワイトノイズ再生ロジック ---
  useEffect(() => {
    // const noisePath = whiteNoiseSounds[selectedNoiseKey]; // selectedNoise を使う
    // 有効なパスがない場合は何もしない (ファイルがない場合など)
    // if (!noisePath) return;

    // 選択されたノイズのパスを取得（仮実装）
    const getNoisePath = () => {
      // TODO: SettingsScreen で選択されたキー (selectedNoiseKey) に基づいて
      // whiteNoiseSounds オブジェクトから適切な require パスを返す。
      // 存在しないキーやファイルパスの場合のエラーハンドリングも考慮。
      const key = selectedNoiseKey as keyof typeof whiteNoiseSounds; // 型アサーション
      if (key in whiteNoiseSounds) {
        return whiteNoiseSounds[key];
      }
      // if (selectedNoiseKey === 'rain' && whiteNoiseSounds.rain) {
      //      return whiteNoiseSounds.rain;
      // } else if (selectedNoiseKey === 'waves' && whiteNoiseSounds.waves) {
      //     return whiteNoiseSounds.waves;
      // }
      return null; // 見つからない場合
    };
    const noisePath = getNoisePath();
    if (!noisePath) {
      // サウンドファイルが設定されていない場合は警告を出すか、何もしない
      if (sessionType === 'Focus' && isActive && enableWhiteNoise) {
         console.warn(
           `White noise enabled but sound for key "${selectedNoiseKey}" not found or not configured in TimerScreen.tsx.`
         );
      }
      // 再生中のものがあれば停止する
      stopSound();
      return;
    }

    if (
      sessionType === 'Focus' &&
      isActive &&
      enableWhiteNoise &&
      !isNoiseManuallyPaused
    ) {
      playSound(noisePath);
    } else {
      // フォーカスセッション以外、タイマー非アクティブ、設定無効、または手動で一時停止されている場合は停止
      // stopSound を使うと、手動で Pause -> Resume したときに再生が止まってしまうため Pause に変更
      pauseSound();
    }

    // タイマーが完全に停止されたら、サウンドも停止
    if (!isActive && !isPaused) {
      stopSound();
      setIsNoiseManuallyPaused(false); // ストップしたら手動ポーズ状態もリセット
    }

    // コンポーネントアンマウント時にもサウンドを停止
    return () => {
      stopSound();
    };
    // isNoiseManuallyPaused も依存配列に追加
  }, [
    sessionType,
    isActive,
    isPaused,
    enableWhiteNoise,
    selectedNoiseKey,
    isNoiseManuallyPaused,
  ]);
  // ---------------------------------

  // totalSetsGoal がストアで変更されたら入力フィールドも更新
  useEffect(() => {
    setGoalInput(String(totalSetsGoal));
    // 目標設定後は入力欄を非表示にする（オプション）
    // setShowGoalInput(false);
  }, [totalSetsGoal]);

   // 目標セット数を設定するハンドラ
  const handleSetGoal = () => {
    const goal = parseInt(goalInput, 10);
    if (!isNaN(goal) && goal > 0) {
      setTotalSetsGoal(goal);
      setShowGoalInput(false);
      stopTimer(); // 目標設定したらタイマーはリセット
      setIsNoiseManuallyPaused(false); // ノイズの手動ポーズもリセット
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0 for the goal.');
    }
  };

  // Stop ボタンのハンドラ（タイマーとノイズ状態をリセット）
  const handleStop = () => {
    stopTimer();
    setIsNoiseManuallyPaused(false); // ストップしたら手動ポーズ状態もリセット
  };

  // コントロールボタンの表示ロジック
  const renderControls = () => {
    if (isActive) {
      return (
        <>
          <Button title="Pause" onPress={pauseTimer} />
          <Button title="Stop" onPress={handleStop} color="red" />
        </>
      );
    } else if (isPaused) {
      return (
        <>
          <Button title="Resume" onPress={resumeTimer} />
          <Button title="Stop" onPress={handleStop} color="red" />
        </>
      );
    } else { // 初期状態 or ストップ後
      return <Button title="Start" onPress={startTimer} />;
    }
  };

  // --- ホワイトノイズ手動コントロール ---
  const handleNoiseToggle = () => {
    // const noisePath = whiteNoiseSounds[selectedNoiseKey];
    const getNoisePath = () => {
      const key = selectedNoiseKey as keyof typeof whiteNoiseSounds;
       if (key in whiteNoiseSounds) {
         return whiteNoiseSounds[key];
       }
       return null;
    };
     const noisePath = getNoisePath();
    if (!noisePath) return;

    if (isNoiseManuallyPaused) {
      playSound(noisePath); // 再開
      setIsNoiseManuallyPaused(false);
    } else {
      pauseSound(); // 一時停止
      setIsNoiseManuallyPaused(true);
    }
  };

  const renderNoiseControls = () => {
    // ノイズコントロールは、Focusセッション中、タイマー動作中、かつノイズが有効な場合のみ表示
    if (sessionType === 'Focus' && isActive && enableWhiteNoise) {
      return (
        <Button
          title={isNoiseManuallyPaused ? 'Resume Noise' : 'Pause Noise'}
          onPress={handleNoiseToggle}
        />
      );
    }
    return null;
  };
  // ------------------------------------

  return (
    <View style={styles.container}>
      {/* 目標設定セクション */}
      {showGoalInput && (
        <View style={styles.goalContainer}>
          <Text style={styles.goalLabel}>How many Pomodoro sets today?</Text>
          <TextInput
            style={styles.input}
            value={goalInput}
            onChangeText={setGoalInput}
            keyboardType="number-pad"
            placeholder="e.g., 4"
          />
          <Button title="Set Goal" onPress={handleSetGoal} />
        </View>
      )}

      {/* タイマー表示セクション */}
      {!showGoalInput && (
         <>
            <Text style={styles.sessionType}>{sessionType}</Text>
            <Text style={styles.timerText}>{formatTime(remainingTime)}</Text>
            <Text style={styles.setInfo}>
              Set {currentSet} of {totalSetsGoal}
            </Text>

            {/* タイマーコントロール */}
            <View style={styles.controlsContainer}>{renderControls()}</View>

            {/* ホワイトノイズコントロール */}
            <View style={styles.noiseControlContainer}>
              {renderNoiseControls()}
            </View>

            {/* 目標再設定ボタン (オプション) */}
            <Button title="Change Goal" onPress={() => setShowGoalInput(true)} />
         </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  goalContainer: {
    marginBottom: 40,
    alignItems: 'center',
    width: '80%',
  },
  goalLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '60%',
    textAlign: 'center',
    fontSize: 18,
  },
  sessionType: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'capitalize', // Focus, Short Break など表示
  },
  timerText: {
    fontSize: 80,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  setInfo: {
    fontSize: 18,
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginBottom: 30,
  },
  noiseControlContainer: {
    marginBottom: 30, // Change Goal ボタンとの間隔調整
    height: 40, // ボタンが表示されない場合でもスペースを確保（レイアウト安定のため）
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TimerScreen; 