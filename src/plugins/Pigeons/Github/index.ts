import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Webhooks, createEventHandler } from '@octokit/webhooks'
import { Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Github extends BasePlugin {
  webhook = new Webhooks({
    secret: config.secret,
  })

  eventHandler: ReturnType<typeof createEventHandler> = createEventHandler({
    async transform(event) {
      return event
    },
  })

  init() {
    hono.post('/github', async (context) => {
      const sign = context.req.header('x-hub-signature-256')
      if (!sign) return context.json({ msg: 'missing signature' }, 400)
      const valid = await this.webhook.verify(await context.req.text(), sign)
      if (!valid) return context.json({ msg: 'invalid signature' }, 401)

      const id = context.req.header('x-github-delivery')
      const name = context.req.header('x-github-event')
      if (!id || !name) return context.json({ msg: 'missing id or name' }, 400)

      try {
        await this.eventHandler.receive({
          id,
          name: name as any,
          payload: (await context.req.json()) as any,
        })
      } catch (error) {
        console.error(error)
        return context.json({ msg: 'server error' }, 500)
      }

      return context.json({ msg: 'success' })
    })

    this.eventHandler.on('release.published', async (event) => {
      const message = [
        Structs.text([`[Github] Release推送:`, `仓库: ${event.payload.repository.html_url}`, `版本号: ${event.payload.release.tag_name}`, `更新信息:`, event.payload.release.body].join('\n')),
      ]
      config.groups.forEach(async (group_id) => await sendMsg({ message_type: 'group', group_id }, message))
    })

    this.eventHandler.on('push', async (event) => {
      console.log(event)
      const message = [
        Structs.text(
          [
            `[Github] Push推送:`,
            `仓库: ${event.payload.repository.html_url}`,
            `分支: ${event.payload.ref}`,
            `提交信息:`,
            event.payload.commits
              .map((commit) => {
                return `  - ${commit.message}`
              })
              .join('\n'),
          ].join('\n'),
        ),
      ]
      config.groups.forEach(async (group_id) => await sendMsg({ message_type: 'group', group_id }, message))
    })
  }
}
