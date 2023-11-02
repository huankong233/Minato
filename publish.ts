import { getDir } from '@/libs/getDirName.ts'
import { makeSystemLogger } from '@/libs/logger.ts'
import fs from 'fs/promises'
import { jsonc } from 'jsonc'
import path from 'path'

global.debug = true
const logger = makeSystemLogger({ pluginName: 'publish' })
const baseDir = getDir(import.meta)

const pluginDirs = ['./builtInPlugins', './plugins']
const originPackages = {
  '@huan_kong/go-cqwebsocket': '^6.2.8',
  axios: '^1.6.0',
  'cli-color': '^2.0.3',
  'compare-versions': '^6.1.0',
  'cz-customizable': '^7.0.0',
  jsonc: '^2.0.0',
  knex: '3.0.1',
  'mime-types': '^2.1.35',
  mysql2: '3.6.2',
  'node-emoji': '^2.1.0',
  'node-global-proxy': '1.0.1',
  nodemon: '^3.0.1',
  qs: '^6.11.2',
  tsx: '^3.14.0'
}

for (const pluginDir of pluginDirs) {
  const plugins = await fs.readdir(path.join(baseDir, pluginDir))
  for (const plugin of plugins) {
    const manifestPath = path.join(baseDir, pluginDir, plugin, 'manifest.jsonc')
    try {
      const manifest = jsonc.parse(await fs.readFile(manifestPath, 'utf-8'))
      delete manifest.installed
      await fs.writeFile(manifestPath, jsonc.stringify(manifest))
      logger.SUCCESS(`已删除插件 ${plugin} 的 installed 字段`)
    } catch (error) {
      logger.DEBUG(error)
    }
  }
}

const packagePath = path.join(baseDir, 'package.json')
let packageJSON = jsonc.parse(await fs.readFile(packagePath, { encoding: 'utf-8' }))
packageJSON.dependencies = originPackages
await fs.writeFile(packagePath, JSON.stringify(packageJSON))
logger.SUCCESS(`package.json 回写完成`)
