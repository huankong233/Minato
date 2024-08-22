import axios from 'axios'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'axios' })

const instance = axios.create({
  timeout: 300000
})

if (debug) {
  instance.interceptors.request.use(
    (config) => {
      logger.DEBUG('发送网络请求')
      logger.DIR(config)
      return config
    },
    (err) => {
      logger.DEBUG('发送网络请求时错误')
      logger.DIR(err, true, false)
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
    (err) => {
      logger.DEBUG('收到网络请求错误响应')
      logger.DIR(err, true, false)
      return Promise.reject(err)
    }
  )
}

export default instance
