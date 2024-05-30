import { dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * 获取当前文件的路径
 * @param importMeta 获取方式:import.meta
 * @returns 当前文件的路径
 */
export const getDirname = (importMeta: ImportMeta) => dirname(fileURLToPath(importMeta.url))
