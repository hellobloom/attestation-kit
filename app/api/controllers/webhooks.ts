import * as BatchQueue from '@shared/models/Attestations/BatchQueue'
import { log } from '@shared/logger'

export const txMined = async (req: any, res: any, next: any) => {
  try {
    await BatchQueue.setMined(req.body.tx.id, req.body.tx.txhash)
    return res.status(200).json({'success':true})
  } catch (error) {
    await log(error)
    return res.status(500).json({
      success: false,
      message: 'Failed to construct merkle tree',
      error: error.message,
    })
  }
}
