import axios from 'axios'
import { makeSystemLogger } from './logger.ts'
import { sleep } from './sleep.ts'

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
      // @ts-expect-error 重试次数
      config.retry = config.retry ?? retry
      // @ts-expect-error 已重试次数
      config.retryCount = config.retryCount ?? 0
      // @ts-expect-error 重试间隔
      config.retruDelay = config.retryDelay ?? retryDelay
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
      if (config.retryCount) {
        logger.ERROR(`收到网络请求错误响应[${config.retryCount}/${config.retry}]`)
        logger.DIR(config, false)
        if (config.retryCount >= retry) return Promise.reject(config)
        config.retryCount = config.retryCount + 1
        await sleep(config.retry)
        return instance(config)
      } else {
        logger.ERROR(`收到网络请求错误响应[0/0]`)
        logger.DIR(config, false)
        return Promise.reject(config)
      }
    }
  )
}

export default instance
