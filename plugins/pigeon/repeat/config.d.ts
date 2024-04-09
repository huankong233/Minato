interface repeatConfig {
  times: number
  commonProb: number
}

interface repeatData {
  repeat: {
    [group_id: number]: repeat
  }
}

interface repeat {
  user_id: number[]
  count: number
  message: string
}
