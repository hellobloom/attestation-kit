import {sendAttestTxV2} from '@shared/attestations/sendAttest'
import {TSignedAgreementRequestPayload} from '@shared/attestations/validations'
import {IAttestationResult} from '@shared/models/Attestations/Attestation'
import {serverLogger} from '@shared/logger'

export const submitAttestationV2 = async (job: any): Promise<void> => {
  try {
    const signedAgreement: TSignedAgreementRequestPayload = job.data
    const {attestationId, gasPrice, ...attestParams} = signedAgreement
    const attestationLogicLogs = await sendAttestTxV2(attestParams, gasPrice)
    const result: IAttestationResult = {
      attestationId: attestationLogicLogs.args.attestationId.toNumber(),
    }
    serverLogger.info(
      `[submitAttestationV2] success ${JSON.stringify({
        attestationLogicLogs,
        result,
      })}`
    )
  } catch (err) {
    serverLogger.error(err)
  }
}
