export type user = { user_id: number; reply?: string } | number
export type group = { group_id: number; reply?: string } | number

export type BlockConfig = {
  defaultReply: string
  allowUsers?: number[]
  allowGroups?: number[]
  blockUsers?: user[]
  blockGroups?: group[]
  commands?: {
    defaultReply?: string
    name: RegExp | string
    allowUsers?: number[]
    allowGroups?: number[]
    blockUsers?: user[]
    blockGroups?: group[]
  }[]
}

/**
 * 优先使用单元内的reply字段,如果不存在即使用defaultReply
 * 如果回复内容为空字符串,就不会发送内容
 */

export const config: BlockConfig = {
  defaultReply: '默认回复',
  blockUsers: [],
  blockGroups: [],
  commands: [
    {
      name: /^空空.*[来來发發给給][张張个個幅点點份]?(?<r18>[Rr]18的?)?(?<tag>.*?)?的?[色瑟][图圖]/,
      blockUsers: [10001],
      blockGroups: [{ group_id: 2333, reply: '2333' }],
      defaultReply: '233',
    },
  ],
}
