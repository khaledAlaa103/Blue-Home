import { handleApi } from '../../worker/api.js'
import { bindKv, hydrateFromKv } from '../../server/db.js'

export async function onRequest(context) {
  try {
    process.env.BLUE_HOME_CLOUD = '1'
    process.env.BLUE_HOME_LISTEN = '0'
    if (context.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = context.env.ADMIN_PASSWORD
    bindKv(context.env.DATA)
    await hydrateFromKv()
    return await handleApi(context.request)
  } catch (error) {
    console.error(error?.stack || error)
    return new Response(JSON.stringify({ error: 'خطأ في الخادم' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}
