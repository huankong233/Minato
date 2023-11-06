import fs from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'

/**
 * 加载框架信息
 */
export const getPackage = () =>
  jsonc.parse(
    fs.readFileSync(path.join(global.baseDir, 'package.json'), {
      encoding: 'utf-8'
    })
  )
