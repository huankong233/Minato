/**
 * 暂停
 * @param ms 睡眠时间(毫秒)
 */
export const sleep = (ms = 0): Promise<true> =>
  new Promise(resolve => setTimeout(() => resolve(true), ms))
