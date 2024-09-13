import axios from '@/libs/axios.ts'
import { getRangeCode } from '@/libs/random.ts'
import fs from 'fs-extra'
import mime from 'mime-types'
import path from 'path'

/**
 * 内部方法!!!请勿调用
 * @param url 地址
 * @param fullPath 完整路径
 * @returns
 */
async function _download(url: string, fullPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Refer: url
        }
      })
      .then((res) => {
        const buffer = Buffer.from(res.data, 'binary')
        fs.writeFileSync(fullPath, buffer)
        resolve(fullPath)
      })
      .catch((error) => reject(error))
  })
}

const tempPath = path.join(baseDir, 'temp')

/**
 * 下载文件
 * @param url 下载链接
 * @param ext 如果是下载文件类型未知则使用的文件后缀
 * @returns 完整的下载路径
 */
export async function downloadFile(url: string, ext = '.png') {
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath)

  const fileName = getRangeCode(10) + '.temp'
  const fullPath = path.join(tempPath, fileName)
  const filePath = await _download(url, fullPath)

  const contentType = mime.lookup(filePath)
  if (contentType) {
    const extension = mime.extension(contentType)
    if (extension) ext = '.' + extension
  }

  fs.renameSync(filePath, fullPath + ext)

  return fullPath + ext
}

/**
 * 获取指定文件的base64
 * @param url 地址
 */
export async function getFileBase64(url: string) {
  return await axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Refer: url
      }
    })
    .then((res) => res.data)
    .then((buffer) => Buffer.from(buffer).toString('base64'))
}
