/**
 * 代码魔改于:
 * https://github.com/DIYgod/RSSHub/blob/master/lib/v2/epicgames/index.js
 */

import axios from '@/libs/axios.ts'
import dayjs from 'dayjs'

export const epicApi = async (locale = 'zh-CN', country = 'CN') => {
  const rootUrl = 'https://store.epicgames.com'
  const apiUrl = `https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=${locale}&country=${country}&allowCountries=${country}`
  const contentBaseUrl = `https://store-content-ipv4.ak.epicgames.com/api/${locale}/content`

  const response = await axios.get(apiUrl).then((res) => res.data)

  const now = dayjs()

  const items = response.data.Catalog.searchStore.elements
    .filter(
      (item: any) =>
        item.promotions &&
        item.promotions.promotionalOffers &&
        item.promotions.promotionalOffers.length &&
        item.promotions.promotionalOffers[0].promotionalOffers[0].discountSetting.discountType === 'PERCENTAGE' &&
        item.promotions.promotionalOffers[0].promotionalOffers[0].discountSetting.discountPercentage === 0 &&
        dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].startDate) <= now &&
        dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].endDate) > now,
    )
    .map(async (item: any) => {
      let link = `${rootUrl}/${locale}/p/`
      let contentUrl = `${contentBaseUrl}/products/`
      let isBundles = false
      if (item.categories.some((category: any) => category.path === 'bundles')) {
        link = `${rootUrl}/${locale}/bundles/`
        isBundles = true
        contentUrl = `${contentBaseUrl}/bundles/`
      }
      let linkSlug =
        item.catalogNs.mappings && item.catalogNs.mappings.length > 0
          ? item.catalogNs.mappings[0].pageSlug
          : item.offerMappings && item.offerMappings.length > 0
            ? item.offerMappings[0].pageSlug
            : (item.productSlug ?? item.urlSlug)
      if (item.offerType === 'ADD_ON') {
        linkSlug = item.offerMappings[0].pageSlug
      }
      link += linkSlug
      contentUrl += linkSlug
      let description = item.description
      try {
        const contentResp = await axios.get(contentUrl)
        if (isBundles) {
          description = contentResp.data.data.about.shortDescription
        } else {
          description = contentResp.data.pages[0].data.about.shortDescription
        }
      } catch (_error) {}

      let image = item.keyImages[0].url
      item.keyImages.some((keyImage: any) => {
        if (keyImage.type === 'DieselStoreFrontWide') {
          image = keyImage.url
          return true
        }
        return false
      })
      const end = dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].endDate).format('YYYY-MM-DD HH:mm:ss')
      return {
        title: item.title,
        author: item.seller.name,
        link,
        description: {
          description,
          image,
        },
        endDate: end,
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
        nd: 1,
      },
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
        releasedTime: $(item).find('.search_released').text().trim(),
      }
    })
    .toArray()
}
