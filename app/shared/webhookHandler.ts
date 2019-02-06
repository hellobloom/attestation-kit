import {env} from '@shared/environment'
import fetch from 'node-fetch'
import {log} from '@shared/logger'
import {AttestationStatus} from '@bloomprotocol/attestations-lib'

export const genHeaders = async (headers: any, str: string) => {
  return Object.assign({}, headers, {
    'content-type': 'application/vnd.api+json',
    accept: 'application/json',
    api_token: env.webhook_key,
  })
}

export const webhookRequest = async (action: string, params: any) => {
  const url = env.webhook_host + action
  log.debug('Sending request to webhook', url)

  const request_body = JSON.stringify(params)
  const headers = genHeaders({}, request_body)
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: await headers,
  })

  return true
}

interface INotifyCollect {
  status: AttestationStatus
  attester: string
  requester: string
  nonce: string
  id: string
  negotiationId?: string
}

export const notifyCollectData = async (
  attestation: INotifyCollect,
  version: string
) => {
  await webhookRequest(`/api/${version}/webhooks/prepare_attestation_sig`, {
    attestation,
  })
}
