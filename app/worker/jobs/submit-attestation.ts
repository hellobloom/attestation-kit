import {attesterWallet} from '@shared/attestations/attestationWallets'
import * as newrelic from 'newrelic'
import {Attestation} from '@shared/models'
import {sendAttestTx} from '@shared/attestations/sendAttest'
import {IAttestationResult} from '@shared/models/Attestations/Attestation'
import {serverLogger} from '@shared/logger'
import {env} from '@shared/environment'
import { sendTx } from '@shared/txService'
import { signAttestForDelegation } from '@shared/ethereum/signingLogic'
import { IAttestForParams } from '@shared/attestations/validateAttestParams'

export const submitAttestation = async (job: any) => {
  serverLogger.info('Submitting attestation...')

  if (env.skipValidations) {
    serverLogger.info(
      '[submit-attestation.ts] Skipping validation of subject signature.'
    )
    return
  }

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
  serverLogger.debug('SA: validation outcome', JSON.stringify(attestationParams))

  if (attestationParams.kind === 'validated') {
    serverLogger.debug('SA: Validated attestation params...')

    if (env.txService) {
      serverLogger.info(
        '[submit-attestation.ts] Submitting delegated attestation via tx-service attestFor.'
      )
      const delegationSig = signAttestForDelegation(attestationParams.data, attesterWallet.getPrivateKey())
      const attestForParams: IAttestForParams = {
        subject: attestationParams.data.subject,
        attester: attestationParams.data.attester,
        requester: attestationParams.data.requester,
        reward: attestationParams.data.reward,
        paymentNonce: attestationParams.data.paymentNonce,
        requesterSig: attestationParams.data.requesterSig,
        dataHash: attestationParams.data.dataHash,
        typeIds: attestationParams.data.typeIds,
        requestNonce: attestationParams.data.requestNonce,
        subjectSig: attestationParams.data.subjectSig,
        delegationSig: delegationSig,
      }
      try {
        const response = await sendTx({
          tx: {
            network: job.data.network || 'rinkeby',
            contract_name: 'AttestationLogic',
            method: 'attestFor',
            args: attestForParams,
          },
        })
        if (!response) {
          throw new Error(`No response from tx service`)
        }
        const responseJSON = await response.json()
        console.log(`response from tx service ${JSON.stringify(responseJSON)}`)
        if (responseJSON.success) {
          const txId = responseJSON.tx.id
          // Link attestation to tx service id so we can respond to broadcast webhook later
          await attestation.update({
            tx_id: txId,
          })
        } else {
          throw new Error(`Request to tx service failed: ${JSON.stringify(responseJSON)}`)
        }
    } catch (err) {
      newrelic.recordCustomEvent('ContractError', {
        Action: 'VoteForFailed',
        error: JSON.stringify(err),
      })
    }
    } else {
      serverLogger.info(
        '[submit-attestation.ts] Submitting attestation directly using attest.'
      )
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

    }
  } else {
    newrelic.recordCustomEvent('ContractError', {
      Action: 'SendAttestationFailed',
      negotiationId: job.data.negotiationId,
    })
  }
}
