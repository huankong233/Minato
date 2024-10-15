import axios from 'axios'
import axiosRetry from 'axios-retry'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'axios' })

const instance = axios.create({ timeout: 300000 })

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
    async (config) => {
      // logger.ERROR(`收到网络请求错误响应[${config.retryCount}/${config.retry}]`)
      // logger.DIR(config, false)
      return Promise.reject(config)
    }
  )
}

axiosRetry(instance, {
  retries: 10,
  retryDelay: (retryCount, error) => {
    logger.ERROR(`收到网络请求错误响应[${retryCount}/10]`)
    logger.DIR(error, false)
    return 1000
  }
})

export default instance
