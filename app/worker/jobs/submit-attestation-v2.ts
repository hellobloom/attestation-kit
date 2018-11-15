import {sendAttestTxV2} from '@shared/attestations/sendAttest'
import {TSignedAgreementRequestPayload} from '@shared/attestations/validations'
import Attestation, {
  IAttestationResult,
} from '@shared/models/Attestations/Attestation'
import {serverLogger} from '@shared/logger'
import {bufferToHex} from 'ethereumjs-util'

export const submitAttestationV2 = async (job: any): Promise<void> => {
  try {
    const signedAgreement: TSignedAgreementRequestPayload = job.data
    const attestation = await Attestation.findOne({
      where: {
        negotiationId: signedAgreement.negotiationId,
      },
    })
    if (!attestation) {
      throw Error(
        `Unable to find Attestation with negotiationId of ${
          signedAgreement.negotiationId
        }`
      )
    }
    // const {negotiationId, gasPrice, ...attestParams} = signedAgreement
    const attestationLogicLogs = await sendAttestTxV2(
      {
        subject: signedAgreement.subject,
        requester: signedAgreement.requester,
        reward: await attestation.reward(),
        paymentNonce: attestation.paymentNonce,
        requesterSig: bufferToHex(attestation.paymentSig),
        dataHash: signedAgreement.dataHash,
        requestNonce: signedAgreement.nonce,
        subjectSig: signedAgreement.signature,
      },
      signedAgreement.gasPrice
    )
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
    serverLogger.error('[submitAttestationV2] error', err)
  }
}
