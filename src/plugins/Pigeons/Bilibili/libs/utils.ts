/**
 * 净化链接
 * @param link b站链接
 */
export const purgeLink = (link: string) => {
  try {
    const url = new URL(link)
    if (url.hostname === 'live.bilibili.com') {
      url.search = ''
      url.hash = ''
      return url.href
    }
    url.searchParams.delete('spm_id_from')
    return url.href
  } catch (_error) {}
  return link
}

/**
 * 净化文本中的链接
 * @param text b站链接
 */
export const purgeLinkInText = (text: string) => text.replace(/https?:\/\/[-\w~!@#$%&*()+=;':,.?/]+/g, (url) => purgeLink(url))

/**
 * 获取视频跳转时间字符串
 * @param time 视频时间（秒）
 * @returns 视频跳转时间字符串
 */
export const getVideoJumpTimeStr = (time: number) => {
  if (!time) return ''
  const h = Math.floor(time / 3600)
  const m = Math.floor(time / 60)
  const s = Math.floor(time % 60)
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 获取视频跳转时间
 * @param name
 * @param value
 * @returns
 */
export const getVideoJumpTime = (name: string, value: string) => {
  if (!name) return
  const numValue = Number(value)
  if (!numValue) return
  return name === 'start_progress' ? numValue / 1000 : name === 't' ? numValue : undefined
}
