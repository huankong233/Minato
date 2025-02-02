export interface RepeatConfig {
  // 当检测到某个群有这么多次相同发言后会概率参与复读
  count: number
  // 平时直接复读的概率（百分比 0~100）
  commonProb: number
}

export const config: RepeatConfig = {
  count: 3,
  commonProb: 0.6,
}
