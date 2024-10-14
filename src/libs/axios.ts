import axios from 'axios'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'axios' })

const retry = 10
const retryDelay = 1000
const timeout = 300000

const instance = axios.create({ timeout })

if (debug) {
  instance.interceptors.request.use(
    (config) => {
      logger.DEBUG('发送网络请求')
      logger.DIR(config)
      return config
    },
    (err) => {
      logger.ERROR('发送网络请求时错误')
      logger.DIR(err, false)
      return Promise.reject(err)
    }
  )

  instance.interceptors.response.use(
    (response) => {
      logger.DEBUG('收到网络请求正确响应')
      logger.DIR({
        status: response.status,
        statusText: response.statusText,
        config: response.config,
        headers: response.headers,
        data: response.data
      })
      return response
    },
    (config) => {
      const _retry = config.retry ?? 0
      logger.ERROR(`收到网络请求错误响应[${_retry}/${retry}]`)
      logger.DIR(config, false)
      if (_retry >= retry) return Promise.reject(config)
      // 重试
      config.retry = _retry + 1
      return new Promise((resolve) =>
        setTimeout(() => resolve(instance(config)), config.retry ?? retryDelay)
      )
    }
  )
}

export default instance
