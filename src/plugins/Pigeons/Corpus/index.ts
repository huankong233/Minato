import type { allEvents, Command, Corpus } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { getDateTime } from '@/libs/time.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config as BotConfig } from '@/plugins/BuiltIn/Bot/config.ts'
import PigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { Structs, type AllHandlers, type Receive } from 'node-napcat-ts'
import { parse } from 'path'
import { config, type forget, type learn, type rule } from './config.ts'

export default class CorpusPlugin extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'message',
      callback: this.message.bind(this),
      priority: 999,
    },
    {
      type: 'message',
      callback: this.checkRules.bind(this),
      priority: 998,
    },
    {
      type: 'command',
      commandName: '空空学习',
      description: '空空学习 [匹配模式:模糊/精准] [生效范围:全部/私聊/群聊]',
      params: [
        { type: 'enum', enum: ['模糊', '精准'], default: '模糊' },
        { type: 'enum', enum: ['全部', '私聊', '群聊'], default: '全部' },
      ],
      callback: this.learn.bind(this),
    },
    {
      type: 'command',
      description: '空空忘记',
      commandName: '空空忘记',
      callback: this.forget.bind(this),
    },
  ]

  rules: rule[] = []

  init = this.loadRules

  async loadRules() {
    const data = await knex<Corpus>('corpus').where({ deleted_at: null })
    this.rules = data.map((item) => ({
      keyword: JSON.parse(item.keyword),
      reply: JSON.parse(item.reply),
      mode: item.mode,
      scene: item.scene,
    }))
  }

  matchers = {
    text: (keyword: Receive['text'], message: Receive['text'], mode: rule['mode']) => {
      return mode === '模糊' ? message.data.text.includes(keyword.data.text) : message.data.text === keyword.data.text
    },
    face: (keyword: Receive['face'], message: Receive['face']) => {
      return message.data.id === keyword.data.id
    },
    image: (keyword: Receive['image'], message: Receive['image']) => {
      return parse(keyword.data.file).name === parse(message.data.file).name
    },
  }

  async checkRules(context: AllHandlers['message']) {
    for (const rule of this.rules) {
      if ((rule.scene === '私聊' && context.message_type !== 'private') || (rule.scene === '群聊' && context.message_type !== 'group') || rule.keyword.length !== context.message.length) {
        continue
      }

      for (const [index, message] of context.message.entries()) {
        const keyword = rule.keyword[index]
        if (keyword.type === message.type && this.matchers[keyword.type](keyword as any, message as any, rule.mode)) {
          // 修正reply
          for (const [index, item] of rule.reply.entries()) {
            if (item.type === 'image') {
              const res = await bot.get_image({ file: item.data.file })
              rule.reply[index].data = { ...rule.reply[index].data, url: res.url }
            }
          }
          await sendMsg(context, rule.reply, { reply: false, at: false })
        }
      }
    }
  }

  learners: { [key: number]: learn } = {}
  forgeters: { [key: number]: forget } = []

  async checkNodeAvaliable(context: AllHandlers['message']) {
    const allowNodes = context.message.filter((message) => message.type === 'image' || message.type === 'text' || message.type === 'face')

    if (context.message.length !== allowNodes.length) {
      await sendMsg(context, [Structs.text('关键词只支持文本或图片节点,请重新输入关键词')])
      return false
    }

    const imageNodes = allowNodes.filter((nodes) => nodes.type === 'image')
    if (allowNodes.length !== imageNodes.length && imageNodes.length !== 0) {
      await sendMsg(context, [Structs.text('关键词不支持文本和图片节点混用,请重新输入关键词')])
      return false
    }

    if (imageNodes.length > 1) {
      await sendMsg(context, [Structs.text('关键词只能包含一张图片,请重新输入关键词')])
      return false
    }

    if (imageNodes.length > 1) {
      await sendMsg(context, [Structs.text('关键词只能包含一张图片,请重新输入关键词')])
      return false
    }

    return imageNodes
  }

  async message(context: AllHandlers['message']) {
    const isLearn = this.learners[context.user_id]
    const isForget = this.forgeters[context.user_id]

    const firstMessage = context.message[0]
    const isQuit = firstMessage.type === 'text' && firstMessage.data.text === '退出'

    if (isLearn) {
      if (isQuit) {
        delete this.learners[context.user_id]
        await PigeonTool.add(context, config.add, '退出学习')
        await sendMsg(context, [Structs.text('学习已退出~')])
        return
      }

      if (isLearn.step === 1) {
        const imageNodes = await this.checkNodeAvaliable(context)
        if (!imageNodes) return 'quit'

        // 检查是否重复
        const rule = await knex<Corpus>('corpus')
          .where('keyword', 'like', imageNodes.length !== 0 ? `%${parse(imageNodes[0].data.file).name}%` : JSON.stringify(context.message))
          .where('deleted_at', null)

        if (rule.length > 0) {
          await sendMsg(context, [Structs.text('关键词已存在,请重新输入关键词')])
          return 'quit'
        }

        isLearn.context1 = context
        await sendMsg(context, [Structs.text('请输入回复词')])
      } else if (isLearn.step === 2) {
        isLearn.context2 = context
        await sendMsg(context, [Structs.text('确认插入吗[Y/N]?')])
      } else if (isLearn.step === 3) {
        const oper = firstMessage.type === 'text' && firstMessage.data.text.toUpperCase() === 'Y'
        if (oper) {
          await this.addRule(isLearn)
        } else {
          delete this.learners[context.user_id]
          await PigeonTool.add(context, config.add, '退出学习')
          await sendMsg(context, [Structs.text('已取消插入')])
        }
      }

      isLearn.step += 1
      return 'quit'
    } else if (isForget) {
      if (isQuit) {
        delete this.forgeters[context.user_id]
        await PigeonTool.add(context, config.delete, '退出忘记')
        await sendMsg(context, [Structs.text('忘记已退出~')])
        return
      }

      if (isForget.step === 1) {
        const imageNodes = await this.checkNodeAvaliable(context)
        if (!imageNodes) return 'quit'

        // 检查是否重复
        const rule = await knex<Corpus>('corpus')
          .where('keyword', 'like', imageNodes.length !== 0 ? `%${parse(imageNodes[0].data.file).name}%` : JSON.stringify(context.message))
          .where('deleted_at', null)
          .first()

        if (!rule) {
          await sendMsg(context, [Structs.text('关键词不存在,请重新输入关键词')])
          return 'quit'
        }

        if (rule.user_id !== context.user_id && context.user_id !== BotConfig.admin_id) {
          await sendMsg(context, [Structs.text('无权删除他人的关键词')])
          return 'quit'
        }

        isForget.context = context
        await sendMsg(context, [Structs.text('确认忘记吗[Y/N]?')])
      } else if (isForget.step === 2) {
        const oper = firstMessage.type === 'text' && firstMessage.data.text.toUpperCase() === 'Y'
        if (oper) {
          await this.removeRule(isForget)
        } else {
          delete this.forgeters[context.user_id]
          await PigeonTool.add(context, config.delete, '取消忘记')
          await sendMsg(context, [Structs.text('已取消忘记')])
        }
      }

      isForget.step += 1
      return 'quit'
    }
  }

  async learn(context: AllHandlers['message'], command: Command) {
    const res = await PigeonTool.reduce(context, config.add, '空空学习')
    if (!res) {
      await sendMsg(context, [Structs.text('鸽子不足~')])
      return
    }

    if (this.learners[context.user_id]) return
    const [mode, scene] = command.args
    this.learners[context.user_id] = { context, mode, scene, step: 1 } as learn
    await sendMsg(context, [Structs.text('请输入关键词\n回复 退出 来退出学习')])
  }

  async addRule(learn: learn) {
    const { context, context1, context2, mode, scene } = learn
    const keyword = JSON.stringify(context1.message)
    const reply = JSON.stringify(context2.message)
    delete this.learners[context.user_id]
    await knex<Corpus>('corpus').insert({
      user_id: context.user_id,
      keyword,
      reply,
      scene,
      mode,
      deleted_at: null,
    })
    await sendMsg(context, [Structs.text('插入成功~')])
    await this.loadRules()
  }

  async forget(context: AllHandlers['message'], _command: Command) {
    const res = await PigeonTool.reduce(context, config.add, '空空忘记')
    if (!res) {
      await sendMsg(context, [Structs.text('鸽子不足~')])
      return
    }

    if (this.forgeters[context.user_id]) return
    this.forgeters[context.user_id] = { step: 1 } as forget
    await sendMsg(context, [Structs.text('请输入关键词\n回复 退出 来退出忘记')])
  }

  async removeRule(forget: forget) {
    const { context } = forget
    const keyword = JSON.stringify(context.message)
    delete this.forgeters[context.user_id]

    await knex<Corpus>('corpus')
      .where('keyword', 'like', context.message[0].type === 'image' ? `%${parse(context.message[0].data.file).name}%` : keyword)
      .update('deleted_at', getDateTime('-'))
    await sendMsg(context, [Structs.text('忘记成功~')])
    await this.loadRules()
  }
}
