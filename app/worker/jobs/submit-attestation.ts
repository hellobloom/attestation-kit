import {attesterWallet} from '@shared/attestations/attestationWallets'
import * as newrelic from 'newrelic'
import {Attestation} from '@shared/models'
import {sendAttestTx} from '@shared/attestations/sendAttest'
import {IAttestationResult} from '@shared/models/Attestations/Attestation'
import {notifyAttestationCompleted} from '@shared/webhookHandler'
import {serverLogger} from '@shared/logger'

export const submitAttestation = async (job: any) => {
  serverLogger.info('Submitting attestation...')

  const attestation = await Attestation.findById(job.data.attestationId)

  if (attestation == null) {
    throw new Error(
      `Could not find attestation with negotiation id: ${job.data.negotiationId}`
    )
  }
  serverLogger.debug('SA: Found attestation...')

  // For now also get the attestation entry
  // IP TODO poll for contract logs to update this

  const attestationParams = await attestation.findAndValidateAttestParams(
    attestation.negotiationId
  )

  if (attestationParams.kind === 'validated') {
    serverLogger.debug('SA: Validated attestation params...')

    const attestationLogs = await sendAttestTx(
      attestationParams.data,
      attesterWallet,
      job.data.gasPrice
    )

    serverLogger.debug('Sent attest tx...', attestationLogs.transactionHash)

    newrelic.recordCustomEvent('ContractEvent', {
      Action: 'SendAttestation',
      TxHash: attestationLogs.transactionHash,
    })

    const result: IAttestationResult = {
      attestationId: attestationLogs.args.attestationId.toNumber(),
    }

    serverLogger.debug('Got attestation result', result)

    await attestation.update({
      attestTx: attestationLogs.transactionHash,
      result: result,
      data: null,
    })

    await notifyAttestationCompleted(
      attestation.id,
      attestationLogs.transactionHash,
      attestationParams.data.dataHash,
      JSON.stringify(result)
    )

    if (
      env.clearAttestationData &&
      ['both', 'attester'].indexOf(env.clearAttestationData) != -1
    ) {
      await attestation.clearSensitiveData()
    }
  } else {
    newrelic.recordCustomEvent('ContractError', {
      Action: 'SendAttestationFailed',
      negotiationId: job.data.negotiationId,
    })
  }
}
