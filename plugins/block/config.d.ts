interface blockConfig {
  blockUsers: number[]
  blockGroups: number[]
  defaultReply: string
  blockedCommands: blockRule[]
}

interface blockRule {
  regexp: RegExp
  reply: string
  groupId: number[] | '*'
}
