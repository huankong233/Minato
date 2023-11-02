import type { botConfig } from '@/builtInPlugins/bot/config.d.ts'
import { retryGet } from '@/libs/axios.js'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger } from '@/libs/logger.ts'
import { replyMsg, sendMsg } from '@/libs/sendMsg.js'
import type {
  DiscussMessage,
  GroupMessage,
  PrivateMessage
} from '@huan_kong/go-cqwebsocket/out/Interfaces.d.ts'
import { compare } from 'compare-versions'
import { CronJob } from 'cron'

const logger = makeLogger({ pluginName: 'update' })

export default async () => {
  const { checkUpdateConfig } = global.config as { checkUpdateConfig: checkUpdateConfig }
  if (checkUpdateConfig.enable) {
    await init()
    event()
    if (!debug) setTimeout(checkUpdate, 5000)
  }
}

async function event() {
  eventReg('message', async ({ context }, command) => {
    if (!command) return

    if (command.name === '检查更新') {
      await checkUpdate(true, context)
    }
  })
}

async function init() {
  const { checkUpdateConfig } = global.config
  new CronJob(
    checkUpdateConfig.crontab,
    () => {
      checkUpdate()
    },
    null,
    true
  )
}

async function checkUpdate(
  manual = false,
  context?: PrivateMessage | GroupMessage | DiscussMessage
) {
  const { botConfig, checkUpdateConfig, proxyConfig } = global.config as {
    botConfig: botConfig
    checkUpdateConfig: checkUpdateConfig
    proxyConfig: proxyConfig
  }

  let { proxy, url } = checkUpdateConfig

  // 如果已经启用了全局代理就禁用git代理
  if (!proxyConfig.enable) {
    url = proxy + url
  }

  const local_version = packageData.version
  let remote_version: string = '0.0.0'

  try {
    remote_version = await retryGet(url).then(res => res.data.version)
  } catch (error) {
    logger.WARNING('检查更新失败')
    logger.ERROR(error)
  }

  let message = ['检查更新失败', `当前版本: ${local_version}`, `请检查您的网络状况！`].join('\n')

  if (remote_version && local_version) {
    if (compare(local_version, remote_version, '<')) {
      //需要更新，通知admin
      message = [
        'kkbot有更新哟~',
        `最新版本: ${remote_version}`,
        `当前版本: ${local_version}`
      ].join('\n')
    }

    if (manual && compare(local_version, remote_version, '>=')) {
      message = [
        'kkbot无需更新哟~',
        `最新版本: ${remote_version}`,
        `当前版本: ${local_version}`
      ].join('\n')
    }
  }

  return manual && context
    ? await replyMsg(context, message, { reply: true })
    : await sendMsg(botConfig.admin, message)
}
