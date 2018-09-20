import * as m from '@shared/models'
import {serverLogger} from '@shared/logger'
import {bufferToHex, sha256} from 'ethereumjs-util'
import * as dc from 'deepcopy'

// perform attestation on an existing request
export const show = async (req: any, res: any) => {
  const ad = await m.AttestationData.findById(req.params.attestation_data_id)

  if (!ad) {
    return res.status(404).json({success: false, message: 'Not found'})
  }

  const adRaw = ad.get({raw: true})

  if (!ad.testChallenge(req.body.passphrase)) {
    res
      .status(401)
      .json({success: false, message: 'Invalid credentials for attestation data'})
  }

  res.json({
    success: true,
    attestation_data: {
      id: adRaw.id,
      created: adRaw.created,
      updated: adRaw.updated,
      messageType: adRaw.messageType,
      data: adRaw.datatype === 'text' ? adRaw.dtext : adRaw.dblob,
      datatype: adRaw.datatype,
      messageType: adRaw.messageType,
    },
  })
}

export const destroy = async (req: any, res: any) => {
  const ad = await m.AttestationData.findById(req.params.attestation_data_id)

  if (!ad) {
    res.status(404).json({success: false, message: 'Not found'})
  }

  if (!ad.testChallenge(req.body.passphrase)) {
    res
      .status(401)
      .json({success: false, message: 'Invalid credentials for attestation data'})
  }

  await ad.destroy()
}
