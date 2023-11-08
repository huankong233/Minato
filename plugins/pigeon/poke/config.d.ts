interface pokeConfig {
  reply: string[]
  banReply: string[]
  banProb: number
  banCount: number
  banTime: [min: number, max: number]
}

interface pokeData {
  count: { [key: number]: number }
}
