export interface AdminConfig {
  /**
   * message: 通知
   * agree: 自动同意
   */
  invite: {
    message: boolean
    auto: 'accept' | 'reject' | ''
  }
  add: {
    message: boolean
    auto: 'accept' | 'reject' | ''
  }
  friend: {
    message: boolean
    auto: 'accept' | 'reject' | ''
  }
  notice: boolean
}

export const config: AdminConfig = {
  invite: {
    message: true,
    auto: 'accept',
  },
  add: {
    message: true,
    auto: '',
  },
  friend: {
    message: true,
    auto: 'accept',
  },
  notice: true,
}
