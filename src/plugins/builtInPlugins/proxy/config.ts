export interface ProxyConfig {
  enable: boolean
  proxy: {
    http: string
    https: string
  }
}

export const config: ProxyConfig = {
  enable: true,
  proxy: {
    http: 'http://127.0.0.1:7890',
    https: 'http://127.0.0.1:7890'
  }
}
