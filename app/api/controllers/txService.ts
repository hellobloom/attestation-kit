import * as express from 'express-serve-static-core'
import * as Raven from 'raven'
// import {serverLogger} from '@server/logger'
import {webhookOnly, txServiceWebhookOnly} from './requestHandlers'
import {renderError} from './renderError'
import {UserTx, Tx} from '@server/models'
import {TxData} from '@shared/TxData'
import {EContractNames} from '@shared/method_manifest'
import {TxStatus} from '@shared/TxStatus'
import {toBuffer} from 'ethereumjs-util'
// import {Attestation} from '@server/models/index'
// import {enqueueJob} from '@server/jobWorker/util'
// import {toBuffer} from 'ethereumjs-util'

// import {AttestationTypeID} from '@bloomprotocol/attestations-lib'

export enum ENetworks {
  'mainnet' = 'mainnet',
  'rinkeby' = 'rinkeby',
  'local' = 'local',
  'kovan' = 'kovan',
  'sokol' = 'sokol',
  'ropsten' = 'ropsten',
}

interface ITxInput {
  sender_address: string
  nonce: number
  network: ENetworks
  contract_name: EContractNames
  contract_address: string
  method: string
  args: Array<any>
  estimate_retries: number
  max_estimate_retries: number
  status: TxStatus
  txhash: Buffer
  block_number: number
}

const getTxStatus = (inputTx: ITxInput) =>
  inputTx.status === 'broadcast' ? TxStatus.pending : inputTx.status

export default (app: express.Application) => {
  app.post(
    '/api/webhooks/tx_broadcast',
    txServiceWebhookOnly,
    webhookOnly,
    async (req, res) => {
      try {
        const txInput = req.body.tx as any
        const txAttemptInput = req.body.tx_attempt as any

        const tx: TxData = {
          hash: txAttemptInput.txhash as string,
          networkId: txInput.network === ENetworks.mainnet ? 1 : 4,
          status: getTxStatus(txInput),
          from: txInput.sender_address as string,
          to: txInput.contract_address as string,

          blockNumber: txAttemptInput.block_number as number,
          gas: txAttemptInput.gas as number,
          gasPrice: txAttemptInput.gas_price as number,
          data: req.body.tx_data as string,
          nonce: txAttemptInput.nonce as number,
        }

        await UserTx.linkToUser(tx)
        res.json({success: true})
      } catch (error) {
        sendToSentry(error)
        console.log('Caught error handling tx_broadcast notification', error)
        renderError(req, res, 500)('Internal server error')
      }
    }
  )

  app.post(
    '/api/webhooks/tx_mined',
    txServiceWebhookOnly,
    webhookOnly,
    async (req, res) => {
      try {
        await updateTxStatus(req.body)
        res.json({success: true})
      } catch (error) {
        sendToSentry(error)
        console.log('Caught error handling tx_mined notification', error)
        renderError(req, res, 500)('Internal server error')
      }
    }
  )

  app.post(
    '/api/webhooks/tx_failed',
    txServiceWebhookOnly,
    webhookOnly,
    async (req, res) => {
      try {
        await updateTxStatus(req.body)
        res.json({success: true})
      } catch (error) {
        sendToSentry(error)
        console.log('Caught error handling tx_completed notification', error)
        renderError(req, res, 500)('Internal server error')
      }
    }
  )
}

function sendToSentry(error: Error) {
  Raven.captureException(error, {
    tags: {logger: 'express', label: 'tx-service-webhook'},
  })
}

async function updateTxStatus(input: ITxInput) {
  await Tx.update(
    {
      status: getTxStatus(input),
      blockNumber: input.block_number,
    },
    {
      where: {tx: toBuffer(input.txhash)},
    }
  )
}
