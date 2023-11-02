import { retryAsync } from '@/libs/retry.ts'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// 默认超时时间 30s
axios.defaults.timeout = 300000

export async function retryGet<T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  return retryAsync(() => {
    return axios.get(url, config)
  })
}

export async function retryPost<T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  return retryAsync(() => {
    return axios.post(url, data, config)
  })
}
