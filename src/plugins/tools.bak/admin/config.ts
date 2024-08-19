export interface AdminConfig {
  /**
   * message: 通知
   * agree: 自动同意
   */
  invite: {
    message: boolean
    agree: boolean
  }
  add: {
    message: boolean
    agree: boolean
  }
  friend: {
    message: boolean
    agree: boolean
  }
}

export const config: AdminConfig = {
  invite: {
    message: true,
    agree: false
  },
  add: {
    message: true,
    agree: false
  },
  friend: {
    message: true,
    agree: true
  }
}