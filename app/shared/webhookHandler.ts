import {env} from '@shared/environment'
import fetch from 'node-fetch'
import {serverLogger} from '@shared/logger'

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

export const notifyCollectData = async (attestation: any, version: string) => {
  // EH TODO Decide if the endpoint name `prepare_attestation_sig` is still proper...
  await webhookRequest(`/api/${version}/webhooks/prepare_attestation_sig`, {
    attestation,
  })
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
