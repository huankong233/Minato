import dayjs from 'dayjs'

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export const get_date_time = (split = '/', split2 = ':') => dayjs().format(`YYYY${split}MM${split}DD HH${split2}mm${split2}ss`)

/**
 * 排序对象数组
 * @param arr
 * @param property
 * @param sortType up=>升序
 * @param sortType down=>降序
 */
export function sort_object_array<T extends object>(arr: T[], property: keyof T, sortType: 'up' | 'down' = 'up'): T[] {
  return arr.sort((a, b) => {
    if (a[property] > b[property]) return sortType === 'up' ? 1 : -1
    if (a[property] < b[property]) return sortType === 'up' ? -1 : 1
    return 0
  })
}

/**
 * 判断一个值是否为对象
 * @param value
 * @returns
 */
export function is_object(value: unknown): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
