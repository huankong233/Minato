export interface SearchImageConfig {
  reduce: number
  back: number
  limit: number
  limit2: number
  ascii2dProxy: boolean
  autoLeave: number
  word: {
    on_reply: string
    off_reply: string
    receive: string
  }
}

export const config: SearchImageConfig = {
  //搜图一次消耗
  reduce: 35,
  //失败后恢复多少
  back: 5,
  //限制显示数量
  limit: 3,
  //限制搜索动漫/游戏显示数量
  limit2: 5,
  //是否使用代理
  ascii2dProxy: true,
  //搜图之后自动退出搜图模式 单位(秒)
  autoLeave: 30,
  //触发的几个关键词
  word: {
    //打开搜图模式后的回复
    on_reply: '已开启搜图模式~把图片给我叭~',
    //关闭搜图模式后的回复
    off_reply: '已退出搜图模式~',
    //收到图片后的回复
    receive: '收到咯~处理中~(自动退出不影响处理)'
  }
}

import type {
  AnimeTraceReq,
  AnimeTraceRes,
  ascii2dReq,
  ascii2dRes,
  IqDBReq,
  IqDBRes,
  SauceNAOReq,
  SauceNAORes,
  TraceMoeReq,
  TraceMoeRes
} from 'image_searcher'

export type searchImageParams =
  | {
      name: 'ascii2d'
      callback: (req: ascii2dReq) => Promise<ascii2dRes>
      params: ascii2dReq
    }
  | {
      name: 'SauceNAO'
      callback: (req: SauceNAOReq) => Promise<SauceNAORes>
      params: SauceNAOReq
    }
  | {
      name: 'IqDB'
      callback: (req: IqDBReq) => Promise<IqDBRes>
      params: IqDBReq
    }
  | {
      name: 'TraceMoe'
      callback: (req: TraceMoeReq) => Promise<TraceMoeRes[]>
      params: TraceMoeReq
    }
  | {
      name: 'AnimeTraceAll' | 'AnimeTraceAnime' | 'AnimeTraceGame'
      callback: (req: AnimeTraceReq) => Promise<AnimeTraceRes>
      params: AnimeTraceReq
    }
