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
    `insert into "batchQueue" ("batchLayer2Hash") values (:batchLayer2Hash)`,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {batchLayer2Hash: toBuffer(batchLayer2Hash)},
    }
  )
}

export async function getRoot(leaf: Buffer) {
  const result: {root: Buffer}[] = await sequelize.query(
    `
      select root from "batchQueue" bq
      join "batchTree" bt on bt.id = bq."treeId"
      where bq."batchLayer2Hash" = :leaf
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {leaf}
    }
  )
  
  return result.length === 1 ? result[0].root : null
}

export async function getLeaves(root: Buffer | null) {
  const leaves: {batchLayer2Hash: Buffer, txHash: Buffer}[] = await sequelize.query(
    `
      select "batchLayer2Hash", "txHash" from "batchQueue" bq
      join "batchTree" bt on bt.id = bq."treeId"
      where bt.root = :root
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {root}
    }
  )

  let txHash: string | null = null
  if(leaves.length > 0 && leaves[0].txHash) {
    txHash = `0x${leaves[0].txHash.toString('hex')}`
  }

  return {
    leaves: leaves.map(h => `0x${h.batchLayer2Hash.toString('hex')}`),
    txHash
  } 
}

export async function setMined(txServiceId: number, txhash: string) {
  const mined = await sequelize.query(
    `update "batchTree" set "txHash" = :txhash::bytea where "txServiceId" = :txServiceId
    returning id`,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {txhash: toBuffer(txhash), txServiceId},
    }
  )

  if(mined.length === 0) {
    throw new Error('Could not find batchTree with the specified hash')
  }
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

export async function finish(hashes: string[], root: Buffer, txServiceId: number) {
  return sequelize.transaction(
    {
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async transaction => {
      const [tree]: {id: number}[] = await sequelize.query(
        `
          insert into "batchTree" (root, "txServiceId") values (:root::bytea, :txServiceId)
          returning id;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: {root, txServiceId},
          transaction
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
          transaction
        }
      )
    
      if(updated.length !== hashes.length) {
        throw new Error('invalid number of hashes updated')
      }
    })
}
