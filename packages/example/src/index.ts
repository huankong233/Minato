import { Minato } from '@huan_kong/minato'
import { config } from 'dotenv'
import path from 'node:path'
import process from 'node:process'

config({
  path: path.join(import.meta.dirname, '../.env'),
  quiet: true,
})

const minato = await Minato.init(
  {
    base_dir: import.meta.dirname,
    protocol: (process.env.NC_PROTOCOL as 'ws' | 'wss') ?? 'ws',
    host: process.env.NC_HOST ?? '127.0.0.1',
    port: parseInt(process.env.NC_PORT ?? '3001'),
    accessToken: process.env.NC_ACCESS_TOKEN,
    reconnection: {
      enable: true,
      attempts: 1,
      delay: 5000,
    },
  },
  process.argv.includes('--debug'),
)

await minato.load_plugin('./plugins/hello')
await minato.load_plugin('./plugins/call')

minato.logger.SUCCESS(`所有插件已加载完成`)
