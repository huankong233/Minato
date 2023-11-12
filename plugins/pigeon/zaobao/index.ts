import type { fakeContext } from '@/global.d.ts'
import type { CQEvent } from '@huan_kong/go-cqwebsocket'
import { CQ } from '@huan_kong/go-cqwebsocket'
import { CronJob } from 'cron'
import { sleep } from '@/libs/sleep.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { retryAsync } from '@/libs/retry.ts'
import { retryGet } from '@/libs/axios.ts'
import { replyMsg } from '@/libs/sendMsg.ts'
import { makeLogger } from '@/libs/logger.ts'
import { getDate } from '@/libs/time.ts'

const logger = makeLogger({ pluginName: 'zaobao' })

export default async () => {
  await init()

  event()
}

function event() {
  eventReg('message', async ({ context }, command) => {
    if (!command) return
    if (command.name === '早报') await zaobao(context)
  })
}

async function init() {
  const { zaobaoConfig } = global.config as { zaobaoConfig: zaobaoConfig }

  if (zaobaoConfig.groups.length === 0) return

  new CronJob(
    zaobaoConfig.crontab,
    async () => {
      const message = await prepareMessage()

      for (let i = 0; i < zaobaoConfig.groups.length; i++) {
        const group_id = zaobaoConfig.groups[i]

        const fakeContext: fakeContext = {
          message_type: 'group',
          group_id,
          user_id: 123
        }

        await replyMsg(fakeContext, message)
        await sleep(zaobaoConfig.cd * 1000)
      }
    },
    null,
    true
  )
}

async function zaobao(context: CQEvent<'message'>['context']) {
  await replyMsg(context, await prepareMessage())
}

const urls = new Map([
  [
    '每天60秒',
    {
      api: 'https://api.2xb.cn/zaob',
      checkSuccess: (data: any) => data.msg === 'Success',
      getImage: (data: any) => data.imageUrl,
      checkDate: (data: any) => data.datatime === getDate()
    }
  ],
  [
    '摸鱼人日历',
    {
      api: 'https://api.vvhan.com/api/moyu?type=json',
      checkSuccess: (data: any) => data.success,
      getImage: (data: any) => data.url,
      checkDate: () => true
    }
  ]
])

async function prepareMessage() {
  const { zaobaoConfig } = global.config as { zaobaoConfig: zaobaoConfig }
  const params = urls.get(zaobaoConfig.type)
  if (!params) throw new Error('错误的类型')

  let response

  try {
    await retryAsync(
      async () => {
        const res = await retryGet(params.api).then(res => res.data)
        if (!params['checkSuccess'](res)) {
          throw new Error('早报获取失败')
        } else if (!params['checkDate'](res)) {
          throw new Error('时间检验失败')
        } else {
          response = res
        }
      },
      10,
      1000 * 60 * 30
    )
  } catch (error) {
    logger.WARNING('早报获取失败')
    logger.ERROR(error)
    return '早报获取失败'
  }

  if (response) {
    return CQ.image(params['getImage'](response)).toString()
  } else {
    return '早报获取失败'
  }
}
