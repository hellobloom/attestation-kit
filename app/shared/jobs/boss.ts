import {env} from '@shared/environment'
const PgBoss = require('pg-boss')

export const boss = (async () => {
  let e = await env()
  const boss_raw = new PgBoss(e.dbUrl)
  boss_raw.start()
  return boss_raw
})()
