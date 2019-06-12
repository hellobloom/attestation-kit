import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { log } from '@shared/logger'
import { HashingLogic } from '@bloomprotocol/attestations-lib'
import { toBuffer } from 'ethereumjs-util'

export const getProof = async (req: any, res: any, next: any) => {
  try {
    const leaf = toBuffer(req.body.leaf)
    if(leaf.length !== 32) {
      return error(res, 'invalid buffer length for leaf')
    }

    const root = await BatchQueue.getRoot(leaf)
    const leaves = await BatchQueue.getLeaves(root)
    if(leaves.leaves.length === 0) {
      return res.status(200).json({proof: [], txHash: leaves.txHash, root})
    }

    const merkleTree = HashingLogic.getMerkleTreeFromLeaves(leaves.leaves)
    const proof = merkleTree.getProof(leaf)
    
    return res.status(200).json({
      proof: proof.map(p => ({
        position: p.position, data: `0x${p.data.toString('hex')}`
      })),
      txHash: leaves.txHash, 
      root: root ? `0x${root.toString('hex')}` : null,
      leaf: req.body.leaf
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

function error(res: any, message: string) {
  log(message)
  res.status(400).json({success: false, message})
}
