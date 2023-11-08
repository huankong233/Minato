interface repeatConfig {
  times: 3
  commonProb: 0.05
}

interface repeatData {
  repeat: {
    [key: number]: repeat
  }
}

interface repeat {
  user_id: number[]
  count: number
  message: string
}
