import {sendAttestTxV2} from '@shared/attestations/sendAttest'
import {TSignedAgreementRequestPayload} from '@shared/attestations/validations'
import {notifyAttestationCompleted} from '@shared/webhookHandler'
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

    await notifyAttestationCompleted(
      attestationId,
      attestationLogicLogs.transactionHash,
      signedAgreement.dataHash,
      JSON.stringify(result),
      'v2'
    )
  } catch (err) {
    serverLogger.error(err)

    // EH TODO REMOVE THIS!!!!
    const signedAgreement: TSignedAgreementRequestPayload = job.data
    await notifyAttestationCompleted(
      signedAgreement.attestationId,
      '0x0',
      signedAgreement.dataHash,
      JSON.stringify({attestationId: -1}),
      'v2'
    )
  }
}
