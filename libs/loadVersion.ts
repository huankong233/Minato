import fs from 'fs/promises'
import path from 'path'
import { jsonc } from 'jsonc'

/**
 * 加载框架信息
 */
export const getPackage = async () =>
  jsonc.parse(
    await fs.readFile(path.join(global.baseDir, 'package.json'), {
      encoding: 'utf-8'
    })
  )
