interface blockConfig {
  blockUsers: number[]
  blockGroups: number[]
  defaultReply: string
  blockedCommands: blockRule[]
}

interface blockRule {
  regexp: RegExp
  reply: string | null | undefined
  whiteUser?: number[] | '*'
  blackUser?: number[] | '*'
  whiteGroup?: number[] | '*'
  blackGroup?: number[] | '*'
}
