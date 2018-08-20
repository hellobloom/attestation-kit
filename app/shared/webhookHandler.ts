import {env} from '@shared/environment'
import fetch from 'node-fetch'
import {serverLogger} from '@shared/logger'

// import {primaryWallet} from '@shared/attestations/attestationWallets'

export const genHeaders = async (headers: any, str: string) => {
  return Object.assign({}, headers, {
    'content-type': 'application/vnd.api+json',
    accept: 'application/json',
    api_token: env.webhook_key,
  })
}

export const webhookRequest = async (action: string, params: any) => {
  const url = env.webhook_host + action
  serverLogger.debug('Sending request to webhook', url)

  const request_body = JSON.stringify(params)
  const headers = genHeaders({}, request_body)
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: await headers,
  })

  return true
}

export const notifyCollectData = async (attestation: any) => {
  await webhookRequest('/api/webhooks/prepare_attestation_sig', {attestation})
}

export const notifyDoAttestation = async (
  job_details: any,
  attestationId: string
) => {
  await webhookRequest('/api/webhooks/perform_attestation', {
    job_details: JSON.stringify(job_details),
    id: attestationId,
  })
}

export const notifyAttestationCompleted = async (
  attestation_id: string,
  transaction_hash: string,
  data_hash: string,
  result: string
) => {
  await webhookRequest('/api/webhooks/attestation_completed', {
    attestation_id,
    transaction_hash,
    data_hash,
    result,
  })
}
