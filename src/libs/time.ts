import dayjs from 'dayjs'

/**
 * 格式化时间,将秒转换为HH:MM:SS的格式
 * @param ms 毫秒
 * @returns HH:MM:SS
 */
export function formatTime(ms: number) {
  // 使用 padStart 方法补零
  const totalSeconds = Math.floor(ms / 1000) // 毫秒转秒
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  // 返回 HH:MM:SS 的字符串
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 判断时间戳是否是今天的
 * @param timestamp 时间戳
 * @returns 是否是今天
 */
export function isBeforeToday(timestamp: number) {
  return dayjs(timestamp).isBefore(dayjs(), 'day')
}

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export const getDateTime = (split = '/', split2 = ':') => dayjs().format(`YYYY${split}MM${split}DD HH${split2}mm${split2}ss`)

/**
 * 获取日期
 * @returns 2023-06-26
 */
export const getDate = () => dayjs().format(`YYYY-MM-DD`)
