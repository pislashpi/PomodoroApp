/**
 * 秒数を MM:SS 形式の文字列にフォーマットします。
 * @param totalSeconds - フォーマットする合計秒数
 * @returns MM:SS 形式の文字列 (例: "25:00", "05:30")
 */
export const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}; 