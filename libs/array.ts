/**
 * 排序对象数组
 * @param arr
 * @param property
 * @param sortType up=>升序
 * @param sortType down=>降序
 */
export function sortObjectArray<T extends { [key: string]: any }>(
  arr: T[],
  property: string,
  sortType: 'up' | 'down' = 'up'
): T[] {
  return arr.sort((a, b) => {
    if (a[property] > b[property]) {
      return sortType === 'up' ? -1 : 1
    }

    if (a[property] < b[property]) {
      return sortType === 'up' ? 1 : -1
    }

    return 0
  })
}
