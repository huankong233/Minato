import axios from '@/libs/axios.ts'
import type { Logger } from '@/libs/logger.ts'

export const getGoldPrice = async (logger: Logger) => {
  // https://api.jijinhao.com/sQuoteCenter/realTime.htm?code=JO_9753&_=1725002244237
  const res = await axios.get(
    `https://api.jijinhao.com/sQuoteCenter/realTime.htm?code=JO_9753&_=${Date.now()}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Referer: 'https://quote.cngold.org/'
      }
    }
  )

  let data: string[]
  try {
    data = res.data
      .replaceAll('var hq_str = "', '')
      .replaceAll(',";', '')
      .replaceAll('\n', '')
      .split(',')
  } catch (error) {
    logger.ERROR('处理数据失败')
    logger.DIR(error, false, false)
    return null
  }

  return {
    name: data[0],
    prevclose: data[2],
    price: data[3],
    high: data[4],
    low: data[5],
    totalVolumn: data[8],
    totaldataount: data[9],
    today: data[30],
    nowtime: data[31],
    fixed: data[33],
    pricedownPrice: data[34],
    pricedownPrecent: data[35],
    buyPrice: data[36],
    sellPrice: data[37],
    open: data[38],
    status: data[39],
    quoteToday: data[40],
    quotetime: data[41]
  }
}
