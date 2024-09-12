export interface GuguConfig {
  //新用户增加
  newUserAdd: number
  //每次咕咕给多少
  oldUserAdd: number
}

export const config: GuguConfig = {
  newUserAdd: 300,
  oldUserAdd: 100
}
