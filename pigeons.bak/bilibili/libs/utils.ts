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
export const purgeLinkInText = (text: string) =>
  text.replace(/https?:\/\/[-\w~!@#$%&*()+=;':,.?/]+/g, (url) => purgeLink(url))
