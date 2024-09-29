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
  // 创建一个新的 Date 对象，并使用传入的时间戳
  const date = new Date(timestamp)

  // 创建一个表示今天日期的 Date 对象，但不包含时间部分
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 比较传入时间戳的日期是否早于今天
  return date < today
}

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export const getDateTime = (split = '/', split2 = ':') =>
  new Date().toLocaleString().replaceAll('/', split).replaceAll(':', split2)

/**
 * 获取日期
 * @returns 2023-06-26
 */
export const getDate = () => new Date().toISOString().slice(0, 10)
