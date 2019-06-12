import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { log } from '@shared/logger'
import { HashingLogic } from '@bloomprotocol/attestations-lib'
import { toBuffer } from 'ethereumjs-util'

export const getProof = async (req: any, res: any, next: any) => {
  try {
    let root: Buffer
    let leaf: Buffer
    try {
      root = toBuffer(req.body.root)
      leaf = toBuffer(req.body.leaf)
      if(root.length !== 32 || leaf.length !== 32) {
        throw new Error('invalid buffer length for root or leaf')
      }
    } catch (err) {
      log(err)
      return res.status(400).json({
        success: false, 
        message: 'root and leaf must be a 32 byte hex string'
      })
    }
    
    const leaves = await BatchQueue.getLeaves(root)
    const merkleTree = HashingLogic.getMerkleTreeFromLeaves(leaves.leaves)
    const proof = merkleTree.getProof(leaf)
    return res.status(200).json({
      success: true,
      proof: proof.map(p => ({
        position: p.position, data: `0x${p.data.toString('hex')}`
      })),
      txHash: leaves.txHash
    })
  } catch (error) {
    await log(error)
    return res.status(500).json({
      success: false,
      message: 'Failed to construct merkle tree',
      error: error.message,
    })
  }
}
