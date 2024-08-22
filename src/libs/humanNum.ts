/**
 * 数字取万
 * @param num 数字
 */
export const humanNum = (num: number) => (num < 10000 ? num : `${(num / 10000).toFixed(1)}万`)
