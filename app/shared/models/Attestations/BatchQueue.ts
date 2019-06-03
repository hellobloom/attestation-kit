import {sequelize} from '@shared/models'
import { toBuffer } from 'ethereumjs-util'

export function inList(count: number) {
  let query = `(`
  for (let id = 0; id < count; id++) {
    query += ` ?,`
  }
  return query.slice(0, -1) + ')'
}

export async function push(batchLayer2Hash: string) {
  return sequelize.query(
    `insert into "batchQueue" values (:batchLayer2Hash)`,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {batchLayer2Hash: toBuffer(batchLayer2Hash)},
    }
  )
}

export async function process() {
  const hashes: {batchLayer2Hash: Buffer}[] = await sequelize.query(
    `
      update "batchQueue" set status = 'processing', "updatedAt" = current_timestamp
      where id in (
        select id
        from "batchQueue"
        where status = 'enqueued' or (status = 'processing' and "updatedAt" < current_timestamp - interval '1 hour')
        limit 1000
        for update skip locked
      )
      returning "batchLayer2Hash"
    `,
    {
      type: sequelize.QueryTypes.SELECT,
    }
  )

  return hashes.map(h =>  `0x${h.batchLayer2Hash.toString('hex')}`)
}

export async function finish(hashes: string[], root: Buffer) {
  console.log('hello')
  const [tree]: {id: number}[] = await sequelize.query(
    `
      insert into "batchTree" (root) values (:root::bytea)
      returning id;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {root},
    }
  )

  const updated: {id: number}[] = await sequelize.query(
    `
      update "batchQueue" set 
        status = 'submitted', 
        "updatedAt" = current_timestamp, 
        "treeId" = ?
      where status = 'processing' and "batchLayer2Hash" in ${inList(hashes.length)}
      returning id;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: [tree.id, ...hashes.map(toBuffer)],
    }
  )

  if(updated.length !== hashes.length) {
    throw new Error('invalid number of hashes updated')
  }
}
