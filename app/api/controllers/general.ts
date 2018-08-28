import * as m from '@shared/models'

export const clearData = async (req: any, res: any) => {
  try {
    const attestation = await m.Attestation.findById(req.params.attestation_id)
    if (!attestation) {
      res.json({success: false, error: 'not_found'})
      return
    }

    var action
    if (req.body.delete_data) {
      await attestation.clearAllData()
      action = 'delete_data'
    } else if (req.body.delete_attestation) {
      await attestation.destroy()
      action = 'delete_attestation'
    } else {
      await attestation.clearSensitiveData()
      action = 'clear_sensitive_data'
    }
    res.json({success: true, action})
  } catch (error) {
    res.json({success: false})
  }
}
