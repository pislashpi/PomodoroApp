import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;
let currentSoundPath: string | null = null; // require() の戻り値追跡は難しいので簡略化

// 再生オプション（ループ再生など）
const playbackOptions = {
  shouldPlay: true,
  isLooping: true, // ホワイトノイズはループ再生
};

/**
 * 指定されたパスのサウンドを読み込みます。
 * すでに別のサウンドが読み込まれている場合はアンロードします。
 * @param soundPath - 再生するサウンドファイルのパス (require を使用)
 */
const loadSound = async (soundPath: any) => { // require() の戻り値は型付けが難しいため any
  try {
    if (soundObject) {
      console.log('Unloading previous sound...');
      await soundObject.unloadAsync();
      soundObject = null;
      currentSoundPath = null;
    }
    console.log('Loading Sound:', soundPath); // デバッグ用にパスを表示
    const { sound } = await Audio.Sound.createAsync(soundPath, playbackOptions);
    soundObject = sound;
    currentSoundPath = soundPath; // パス自体を保持（単純比較用）
    console.log('Sound loaded');
  } catch (error) {
    console.error('Error loading sound:', error);
  }
};

/**
 * 現在読み込まれているサウンドを再生します。
 * 必要であれば、指定されたパスのサウンドを読み込んでから再生します。
 * @param soundPath - 再生するサウンドファイルのパス (require)
 */
export const playSound = async (soundPath: any) => {
  try {
    // 異なるサウンドを再生しようとしているか、まだ何も読み込まれていない場合
    // 注意: require() の戻り値は毎回異なる可能性があるため、単純比較は不確実。
    // 実際にはサウンド識別子 (例: 'rain', 'waves') を引数にとり、それに対応する require パスを使う方が堅牢。
    // ここでは簡略化のためパス（の参照）で比較を試みる。
    if (!soundObject || currentSoundPath !== soundPath) {
      await loadSound(soundPath);
    }
    if (soundObject) {
      console.log('Playing Sound');
      // 再生状態を確認し、必要なら再生開始
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
         await soundObject.playAsync();
         // playAsync() 後に再度オプション設定が必要な場合がある
         await soundObject.setStatusAsync({ shouldPlay: true, isLooping: true });
      }
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

/**
 * 現在再生中のサウンドを一時停止します。
 */
export const pauseSound = async () => {
  if (soundObject) {
    try {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
          console.log('Pausing Sound');
          await soundObject.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  }
};

/**
 * 現在読み込まれているサウンドを停止し、アンロードします。
 */
export const stopSound = async () => {
  if (soundObject) {
    try {
      console.log('Stopping and Unloading Sound');
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
      currentSoundPath = null;
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }
};

/**
 * アプリのオーディオモードを設定します（バックグラウンド再生を許可）。
 * アプリ起動時に一度だけ呼び出すことを想定しています。
 */
export const configureAudio = async () => {
   try {
     await Audio.setAudioModeAsync({
       allowsRecordingIOS: false,
       // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX, // 必要に応じて
       playsInSilentModeIOS: true, // サイレントモードでも再生
       // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, // Android用
       shouldDuckAndroid: true, // Android用
       staysActiveInBackground: true, // バックグラウンド再生を許可
       playThroughEarpieceAndroid: false, // Android用
     });
     console.log('Audio mode configured for background playback.');
   } catch (error) {
     console.error('Error configuring audio mode:', error);
   }
};

// アプリ起動時にオーディオ設定を行う（ファイルインポート時に実行）
configureAudio(); 