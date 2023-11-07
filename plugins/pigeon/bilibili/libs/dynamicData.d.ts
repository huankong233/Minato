export type JsonResponse = {
  code: number
  message: string
  ttl: number
  data: DynamicData
}

type DynamicData = {
  item: {
    id_str: string
    modules: {
      module_author: ModuleAuthor
      module_dynamic: DynamicModule
    }
    type: 'DYNAMIC_TYPE_FORWARD'
    orig: {
      type: 'DYNAMIC_TYPE_NONE'
    }
  }
}

type srcObj = {
  src: string
}

type urlObj = {
  url: string
}

type DynamicModule = {
  additional: {
    type: 'ADDITIONAL_TYPE_VOTE' | 'ADDITIONAL_TYPE_RESERVE'
    vote: { desc: string; end_time: number; join_num: number }
    reserve: { title: string; desc1: { text: string }; desc2: { text: string } }
  }
  desc?: {
    text: string
  }
  major: {
    type:
      | 'MAJOR_TYPE_DRAW'
      | 'MAJOR_TYPE_ARCHIVE'
      | 'MAJOR_TYPE_ARTICLE'
      | 'MAJOR_TYPE_MUSIC'
      | 'MAJOR_TYPE_LIVE'
      | 'MAJOR_TYPE_OPUS'
    archive: {
      cover: string
      aid: string
      bvid: string
      title: string
      stat: {
        play: number
        danmaku: number
      }
    }
    draw: {
      items: srcObj[]
    }
    article: {
      covers: string[]
      id: number
      title: string
      desc: string
    }
    music: {
      cover: string
      id: number
      title: string
      label: string
    }
    live: {
      cover: string
      title: string
      id: number
      live_state: boolean
      desc_first: string
      desc_second: string
    }
    opus: {
      pics: urlObj[]
      summary: {
        text: string
      }
      title: string
    }
  }
}
