import {sendAttestTx} from '@shared/attestations/sendAttest'
import {log} from '@shared/logger'
import {env} from '@shared/environment'
import {sendTx} from '@shared/txService'
import {signAttestForDelegation} from '@shared/ethereum/signingLogic'
import {
  IAttestForParams,
  IAttestParams,
} from '@shared/attestations/validateAttestParams'
import {attesterWallet} from '@shared/attestations/attestationWallets'
import {Attestation} from '@shared/models'

let envPr = env()

export const submitAttestation = async (job: any) => {
  let e = await envPr
  log('Submitting attestation...')
  const attestParams: IAttestParams = job.data
  const attestation = await Attestation.findOne({
    where: {
      id: attestParams.attestationId,
    },
  })
  if (!attestation) {
    log(`Attestation not found for id ${attestParams.attestationId}`, {
      level: 'error',
    })
    return
  }

  if (e.txService) {
    log(
      '[submit-attestation.ts] Submitting delegated attestation via tx-service attestFor.',
      {level: 'error'}
    )
    const delegationSig = signAttestForDelegation(
      e.attestationContracts.logicAddress,
      attestParams,
      attesterWallet.getPrivateKey()
    )
    const attestForParams: IAttestForParams = Object.assign(attestParams, {
      delegationSig: delegationSig,
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
      log(
        {
          name: 'ContractError',
          event: {
            Action: 'SubmitAttestationFailed',
            error: JSON.stringify(err),
          },
        },
        {event: true}
      )
      throw new Error(`SendTx failed. Retryable error: ${JSON.stringify(err)}`)
    }
  } else {
    log('[submit-attestation.ts] Submitting attestation directly using attest.')
    const txHash = await sendAttestTx(job.data, job.data.gasPrice)

    log(`Sent attest tx...${txHash}`, {level: 'debug'})

    log(
      {
        name: 'ContractEvent',
        event: {
          Action: 'SendAttestation',
          TxHash: txHash,
        },
      },
      {event: true}
    )
    await attestation.update({
      attestTx: txHash,
      data: null,
    })
  }
}
