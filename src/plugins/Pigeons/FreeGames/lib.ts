/**
 * 代码魔改于:
 * https://github.com/DIYgod/RSSHub/blob/master/lib/v2/epicgames/index.js
 */

import axios from '@/libs/axios.ts'

const locale = 'zh-CN'
const country = 'CN'

export const epicApi = async () => {
  const rootUrl = 'https://store.epicgames.com'
  const apiUrl = `https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=${locale}&country=${country}&allowCountries=${country}`
  const contentBaseUrl = `https://store-content-ipv4.ak.epicgames.com/api/${locale}/content`

  const response = await axios.get(apiUrl).then((res) => res.data)

  const now = Date.now()

  const items = response.data.Catalog.searchStore.elements
    .filter((item: any) => {
      const data = item?.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
      if (data === undefined) return false
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (start.getTime() + 8 * 60 * 1000 > now || end.getTime() + 8 * 60 * 1000 < now) return false
      return true
    })
    .map(async (item: any) => {
      let link = `${rootUrl}/${locale}/p/`
      let contentUrl = `${contentBaseUrl}/products/`
      let isBundles = false
      item.categories.some((category: any) => {
        if (category.path === 'bundles') {
          link = `${rootUrl}/${locale}/bundles/`
          isBundles = true
          contentUrl = `${contentBaseUrl}/bundles/`
          return true
        }
        return false
      })
      const linkSlug =
        item.catalogNs.mappings.length > 0
          ? item.catalogNs.mappings[0].pageSlug
          : item.offerMappings.length > 0
            ? item.offerMappings[0].pageSlug
            : item.productSlug
              ? item.productSlug
              : item.urlSlug
      link += linkSlug
      contentUrl += linkSlug
      let description = item.description
      if (item.offerType !== 'BASE_GAME') {
        const contentResp = await axios.get(contentUrl).then((res) => res.data)

        description = isBundles
          ? contentResp.data.about.shortDescription
          : contentResp.pages[0].data.about.shortDescription
      }

      let image = item.keyImages[0].url
      item.keyImages.some((keyImage: any) => {
        if (keyImage.type === 'DieselStoreFrontWide') {
          image = keyImage.url
          return true
        }
        return false
      })
      const start = new Date(item.promotions.promotionalOffers[0].promotionalOffers[0].startDate)
      return {
        title: item.title,
        author: item.seller.name,
        link,
        description: {
          description,
          image
        },
        pubDate: new Date(start.getTime() + 8 * 60 * 1000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 16)
      }
    })
  return await Promise.all(items)
}

import * as cheerio from 'cheerio'
export const steamApi = async () => {
  const html = await axios
    .get('https://store.steampowered.com/search', {
      params: {
        maxprice: 'free',
        specials: 1,
        nd: 1
      }
    })
    .then((res) => res.data)

  const $ = cheerio.load(html)
  return $('#search_resultsRows a')
    .map((_index, item) => {
      const info = $(item).find('.responsive_search_name_combined')
      const id = $(item).attr('data-ds-appid')

      return {
        id,
        url: `https://store.steampowered.com/app/${id}`,
        img: $(item).find('.search_capsule img').attr('src'),
        title: info.find('.search_name .title').text(),
        releasedTime: $(item).find('.search_released').text().trim()
      }
    })
    .toArray()
}
