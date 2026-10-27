import { handleApi } from './api.js'
import { bindKv, hydrateFromKv } from '../server/db.js'

export default {
  async fetch(request, env) {
    try {
      process.env.BLUE_HOME_CLOUD = '1'
      process.env.BLUE_HOME_LISTEN = '0'
      if (env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD
      bindKv(env.DATA)
      await hydrateFromKv()
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api')) return handleApi(request)
      return env.ASSETS.fetch(request)
    } catch (error) {
      console.error(error?.stack || error)
      return new Response(JSON.stringify({ error: 'خطأ في الخادم' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }
  },
}
