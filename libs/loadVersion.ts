import fs from 'fs/promises'
import { jsonc } from 'jsonc'
import path from 'path'

/**
 * 加载框架信息
 */
export const getPackage = async () =>
  jsonc.parse(
    await fs.readFile(path.join(global.baseDir, 'package.json'), {
      encoding: 'utf-8'
    })
  )
