export interface BilibiliConfig {
  // 当小程序分享解析成功时是否撤回该小程序，仅在群组内且有管理员权限且发送者是普通成员时有效
  recallMiniProgram: boolean
  getInfo: {
    // 是否获取并输出视频信息
    getVideoInfo: boolean
    // 是否获取并输出动态内容
    getDynamicInfo: boolean
    // 是否获取并输出专栏信息
    getArticleInfo: boolean
    // 是否获取并输出直播间信息
    getLiveRoomInfo: boolean
  }
}

export const config: BilibiliConfig = {
  recallMiniProgram: true,
  getInfo: {
    getVideoInfo: true,
    getDynamicInfo: true,
    getArticleInfo: true,
    getLiveRoomInfo: true
  }
}
