import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- 定義 ---
export type SessionType = 'Focus' | 'Short Break' | 'Long Break';

export interface Settings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  setsBeforeLongBreak: number;
  enableNotifications: boolean;
  // notificationSound: string; // TODO: iOS system sound selection
  enableWhiteNoise: boolean;
  // whiteNoiseSound: string; // TODO: Bundled sound selection
  preventScreenSleep: boolean;
}

export interface TimerState {
  // --- タイマー自体の状態 ---
  sessionType: SessionType;
  remainingTime: number; // seconds
  isActive: boolean;
  isPaused: boolean;
  currentSet: number; // 現在のセット数 (1-indexed)
  totalSetsGoal: number; // 目標セット数

  // --- 設定値 ---
  settings: Settings;

  // --- アクション ---
  setSessionType: (type: SessionType) => void;
  setRemainingTime: (time: number) => void;
  tick: () => void; // 1秒減らす
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void; // 完全停止、初期状態へ
  resetTimerForSession: (type?: SessionType) => void; // 指定タイプ or 次のセッションへ
  incrementSet: () => void;
  resetSets: () => void;
  setTotalSetsGoal: (goal: number) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  loadInitialSettings: () => Promise<void>; // AsyncStorageから読み込む
}

// --- デフォルト設定 ---
const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  setsBeforeLongBreak: 4,
  enableNotifications: true,
  // notificationSound: 'default',
  enableWhiteNoise: false,
  // whiteNoiseSound: 'rain',
  preventScreenSleep: false,
};

// --- Zustand ストア ---
export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // --- 初期状態 ---
      sessionType: 'Focus',
      remainingTime: DEFAULT_SETTINGS.focusDuration * 60, // 秒に変換
      isActive: false,
      isPaused: false,
      currentSet: 1,
      totalSetsGoal: 4, // デフォルト目標
      settings: DEFAULT_SETTINGS,

      // --- アクション実装 ---
      setSessionType: (type) => set({ sessionType: type }),
      setRemainingTime: (time) => set({ remainingTime: time }),
      tick: () => set((state) => ({ remainingTime: Math.max(0, state.remainingTime - 1) })),
      startTimer: () => {
        const { settings, sessionType } = get();
        let duration = 0;
        switch (sessionType) {
          case 'Focus': duration = settings.focusDuration; break;
          case 'Short Break': duration = settings.shortBreakDuration; break;
          case 'Long Break': duration = settings.longBreakDuration; break;
        }
        set({
          isActive: true,
          isPaused: false,
          remainingTime: duration * 60,
         // currentSet: 1, // 開始時にセットをリセットするかどうか？ -> resetTimerForSession で制御
        });
      },
      pauseTimer: () => set({ isPaused: true, isActive: false }), // isActiveもfalseにしておく方が扱いやすいかも
      resumeTimer: () => set((state) => (state.remainingTime > 0 ? { isPaused: false, isActive: true } : state)),
      stopTimer: () => {
        const { settings } = get();
        set({
          isActive: false,
          isPaused: false,
          sessionType: 'Focus',
          remainingTime: settings.focusDuration * 60,
          currentSet: 1, // ストップしたらセットもリセット
        });
        // TODO: バックグラウンドタスクもキャンセルする必要がある
      },
      resetTimerForSession: (type) => {
        const currentType = get().sessionType;
        const nextType = type ?? currentType; // typeが指定されればそれ、なければ現在のでリセット
        const { settings } = get();
        let duration = 0;
        switch (nextType) {
          case 'Focus': duration = settings.focusDuration; break;
          case 'Short Break': duration = settings.shortBreakDuration; break;
          case 'Long Break': duration = settings.longBreakDuration; break;
        }
         set({
          isActive: false, // 自動開始はしない
          isPaused: false,
          sessionType: nextType,
          remainingTime: duration * 60,
        });
      },
      incrementSet: () => set((state) => ({ currentSet: state.currentSet + 1 })),
      resetSets: () => set({ currentSet: 1 }),
      setTotalSetsGoal: (goal) => set({ totalSetsGoal: Math.max(1, goal)}), // 1未満にはしない
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        // 必要であれば、設定変更時に現在のタイマー状態も更新する
        const { isActive, isPaused, sessionType, settings } = get();
        if (!isActive && !isPaused) { // タイマー非稼働中なら残り時間も更新
          let duration = 0;
          switch (sessionType) {
            case 'Focus': duration = settings.focusDuration; break;
            case 'Short Break': duration = settings.shortBreakDuration; break;
            case 'Long Break': duration = settings.longBreakDuration; break;
          }
          set({ remainingTime: duration * 60 });
        }
      },
      // AsyncStorageから設定を読み込むアクション (App.tsx などで最初に呼ぶ想定)
      loadInitialSettings: async () => {
        // persistミドルウェアが自動で読み込むので、カスタムロジックは不要かも？
        // もし必要ならここに実装。例えばデフォルト値とのマージなど。
        // const storedSettings = await AsyncStorage.getItem('timer-storage'); // キー名はpersistの設定に依存
        // if (storedSettings) {
        //   const parsed = JSON.parse(storedSettings);
        //   if (parsed.state?.settings) {
        //      // デフォルトとマージするなどして初期設定を確定
        //      const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.state.settings };
        //      set({ settings: mergedSettings });
        //      // タイマーが動いていない場合、設定に応じた残り時間をセット
        //      if (!get().isActive && !get().isPaused) {
        //        let duration = 0;
        //        switch (get().sessionType) {
        //          case 'Focus': duration = mergedSettings.focusDuration; break;
        //          case 'Short Break': duration = mergedSettings.shortBreakDuration; break;
        //          case 'Long Break': duration = mergedSettings.longBreakDuration; break;
        //        }
        //        set({ remainingTime: duration * 60 });
        //      }
        //   }
        // }
      },
    }),
    {
      name: 'timer-storage', // AsyncStorage に保存する際のキー名
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }), // settings のみ永続化
    }
  )
); 