/**
 * 将对象合并到global中
 * @param obj 需要合并的对象
 */
export const globalReg = (obj: object) => Object.assign(global, obj)
