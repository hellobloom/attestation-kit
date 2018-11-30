import * as newrelic from 'newrelic'
import {sendAttestTx} from '@shared/attestations/sendAttest'
import {serverLogger} from '@shared/logger'
import {env} from '@shared/environment'
import {sendTx} from '@shared/txService'
import {signAttestForDelegation} from '@shared/ethereum/signingLogic'
import {IAttestForParams, IAttestParams} from '@shared/attestations/validateAttestParams'
import { attesterWallet } from '@shared/attestations/attestationWallets'
import { Attestation } from '@shared/models'

export const submitAttestation = async (job: any) => {
  serverLogger.info('Submitting attestation...')
  const attestParams: IAttestParams = job.data
    const attestation = await Attestation.findOne({
      where: {
        id: attestParams.attestationId,
      },
    })
    if (!attestation) {
      throw new Error(`Attestation not found for id ${attestParams.attestationId}`)
    }

    if (env.txService) {
      serverLogger.info(
        '[submit-attestation.ts] Submitting delegated attestation via tx-service attestFor.'
      )
      const delegationSig = signAttestForDelegation(
        env.attestationContracts.logicAddress,
        attestParams,
        attesterWallet.getPrivateKey()
      )
      const attestForParams: IAttestForParams = Object.assign(attestParams, {
        delegationSig: delegationSig
      })
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
          throw new Error(
            `Request to tx service failed: ${JSON.stringify(responseJSON)}`
          )
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
      const txHash = await sendAttestTx(
        job.data,
        job.data.gasPrice
      )

      serverLogger.debug('Sent attest tx...', txHash)

      newrelic.recordCustomEvent('ContractEvent', {
        Action: 'SendAttestation',
        TxHash: txHash,
      })
      await attestation.update({
        attestTx: txHash,
        data: null,
      })
    }
}
