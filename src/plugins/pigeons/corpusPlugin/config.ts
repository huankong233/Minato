import type { AllHandlers, Receive } from 'node-napcat-ts'

export interface rule {
  keyword: (Receive['text'] | Receive['face'] | Receive['mface'] | Receive['image'])[]
  reply: Receive[keyof Receive][]
  mode: '模糊' | '精准'
  scene: '全部' | '私聊' | '群聊'
}

export interface learn {
  context: AllHandlers['message']
  context1: AllHandlers['message']
  context2: AllHandlers['message']
  step: 1 | 2 | 3
  scene: '全部' | '私聊' | '群聊'
  mode: '模糊' | '精准'
}

export interface forget {
  context: AllHandlers['message']
  step: 1 | 2
}

export interface CorpusConfig {
  add: number
  delete: number
}

export const config: CorpusConfig = {
  add: 50,
  delete: 20
}
