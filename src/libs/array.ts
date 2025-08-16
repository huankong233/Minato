/**
 * 排序对象数组
 * @param arr
 * @param property
 * @param sortType up=>升序
 * @param sortType down=>降序
 */
export function sortObjectArray<T extends { [key: string]: any }>(arr: T[], property: keyof T, sortType: 'up' | 'down' = 'up'): T[] {
  return arr.sort((a, b) => {
    if (a[property] > b[property]) return sortType === 'up' ? 1 : -1
    if (a[property] < b[property]) return sortType === 'up' ? -1 : 1
    return 0
  })
}

/**
 * 同时循环两个数组
 * @param iter1
 * @param iter2
 */
export function* zip<T, U>(iter1: Array<T>, iter2: Array<U>): Generator<[number, T, U]> {
  const iterator1 = iter1.entries()
  const iterator2 = iter2.entries()

  while (true) {
    const next1 = iterator1.next()
    const next2 = iterator2.next()

    if (next1.done || next2.done) break

    yield [next1.value[0], next1.value[1], next2.value[1]]
  }
}
