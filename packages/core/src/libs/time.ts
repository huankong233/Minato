import dayjs from 'dayjs'

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export const getDateTime = (split = '/', split2 = ':') => dayjs().format(`YYYY${split}MM${split}DD HH${split2}mm${split2}ss`)
