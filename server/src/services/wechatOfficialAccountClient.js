import { AppError } from '../utils/appError.js'

async function requestWechatJson(url) {
  let response

  try {
    response = await fetch(url)
  } catch {
    throw new AppError(502, 50220, 'WeChat OAuth request failed')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok || !data || data.errcode) {
    throw new AppError(502, 50220, data?.errmsg || 'WeChat OAuth request failed')
  }

  return data
}

export function createWechatOfficialAccountClient() {
  return {
    exchangeCode({ appId, appSecret, code }) {
      const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token')
      url.searchParams.set('appid', appId)
      url.searchParams.set('secret', appSecret)
      url.searchParams.set('code', code)
      url.searchParams.set('grant_type', 'authorization_code')
      return requestWechatJson(url)
    },
    fetchUserInfo({ accessToken, openid }) {
      const url = new URL('https://api.weixin.qq.com/sns/userinfo')
      url.searchParams.set('access_token', accessToken)
      url.searchParams.set('openid', openid)
      url.searchParams.set('lang', 'zh_CN')
      return requestWechatJson(url)
    }
  }
}
