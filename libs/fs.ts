import fs from 'fs/promises'
import path from 'path'

/**
 * 删除文件夹
 * @param folder
 */
export const deleteFolder = async (folder: string) => {
  let files = await fs.readdir(folder)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const dirPath = path.join(folder, file)
    if ((await fs.stat(dirPath)).isDirectory()) {
      deleteFolder(dirPath)
    } else {
      await fs.unlink(dirPath)
    }
  }
  await fs.rmdir(folder)
}

// /**
//  * 内部方法!!!请勿调用
//  * @param {String} url
//  * @param {String} fullPath
//  * @returns
//  */
// async function _download(url, fullPath) {
//   const res = await fetch(url)
//   fullPath += '.temp'
//   const dest = fs.createWriteStream(fullPath)
//   res.body.pipe(dest)
//   return new Promise((resolve, reject) => {
//     dest.on('finish', res => {
//       resolve(fullPath)
//     })
//     dest.on('error', error => {
//       reject(error)
//     })
//   })
// }

// import { getRangeCode } from './random.js'
// import * as mime from 'mime-types'
// /**
//  * 下载文件
//  * @param {String} url
//  * @param {String} ext 下载的文件后缀
//  * @returns {Promise<String>} 完整的下载路径
//  */
// export async function downloadFile(url, ext = '.png') {
//   const fileName = getRangeCode(10)
//   const outPath = path.join(baseDir, 'temp')
//   const fullPath = path.join(outPath, fileName)
//   const tempPath = await _download(url, fullPath)
//   const contentType = mime.lookup(tempPath)
//   if (contentType) {
//     let extension = mime.extension(contentType)
//     ext = extension ? '.' + extension : ext
//   }

//   fs.renameSync(tempPath, fullPath + ext)
//   return fullPath + ext
// }

/**
 * 删除指定数量的老文件
 * @param dirPath 路径
 * @param count 删除多少个
 */
export async function deleteOldestFiles(dirPath: string, count: number) {
  const files = await fs.readdir(dirPath)
  const sortedFiles = await Promise.all(
    files.map(async file => {
      const filePath = path.join(dirPath, file)
      const { birthtime } = await fs.stat(filePath)
      return { file, birthtime }
    })
  )
  sortedFiles.sort((a, b) => a.birthtime.getTime() - b.birthtime.getTime())
  const oldestFiles = sortedFiles.slice(0, count).map(file => file.file)
  await Promise.all(
    oldestFiles.map(file => {
      const filePath = path.join(dirPath, file)
      return fs.unlink(filePath)
    })
  )
}
