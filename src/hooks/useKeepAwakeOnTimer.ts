import { useEffect } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useTimerStore } from '../store/timerStore';

/**
 * タイマーがアクティブかつ設定で有効になっている場合、画面のスリープを防止するカスタムフック
 */
export const useKeepAwakeOnTimer = () => {
  const isActive = useTimerStore((state) => state.isActive);
  const preventScreenSleep = useTimerStore((state) => state.settings.preventScreenSleep);
  const activateKeepAwake = useKeepAwake();

  useEffect(() => {
    if (isActive && preventScreenSleep) {
      activateKeepAwake();
    }
    // deactivateKeepAwake は useKeepAwake フックがアンマウントされるときに自動的に呼ばれる
    // または isActive や preventScreenSleep が false になったときに手動で呼ぶ必要はない
  }, [isActive, preventScreenSleep, activateKeepAwake]);

  // このフックは値を返す必要はない
}; 