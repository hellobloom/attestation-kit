import {env} from '@shared/environment'
const PgBoss = require('pg-boss')

const boss_raw = new PgBoss(env.dbUrl)

export const boss: Promise<any> = new Promise((resolve, reject) => {
  boss_raw
    .start()
    .then(() => {
      resolve(boss_raw as any)
    })
    .catch((err: any) => {
      reject(err)
    })
})
