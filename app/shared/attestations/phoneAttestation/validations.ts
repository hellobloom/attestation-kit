import * as R from 'ramda'
import {TUnvalidated} from '@shared/params/validation'

import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {ClientFacingError} from '@shared/renderError'

type TCognitoSMSWebhook = {
  type: 'sms_verification'
  id: string // Formatted like: 'smsver_22222222222222'
  attributes: {
    created_at: string // Timestamp like: '2018-04-04T18:27:20Z'
    updated_at: string // Timestamp like: '2018-04-04T18:27:20Z'
    delivered_at: null | string // Timestamp like: '2018-04-04T18:27:20Z'
    phone: {
      number: string // Phone number like: '+15717218001'
    }
    message_template: string // Usually: 'Verify this: {{code}}'
    time_limit: number
    status: CognitoSMSStatus
  }
  relationships: {
    profile: {
      data: {
        type: 'profile'
        id: string // Formatted like: 'prf_11111111111111'
      }
    }
  }
}

/**
 * Validates that the data sent in the request body from Cognito is what we expect.
 * Note that we only use the data.attributes.status, so that is all we validate here.
 */
export const validateWebhookData = (data: TUnvalidated<TCognitoSMSWebhook>) =>
  new Promise<{
    smsVerification: string
    cognitoProfile: string
    verificationStatus: CognitoSMSStatus
  }>(async (resolve, reject) => {
    if (R.isNil(data.attributes)) {
      return reject(new ClientFacingError('Missing attributes'))
    }
    if (typeof data.attributes !== 'object') {
      return reject(new ClientFacingError('Attributes must be an object'))
    }
    if (!data.id) {
      return reject(new ClientFacingError('Missing id'))
    }
    if (!data.attributes.status) {
      return reject(new ClientFacingError('Missing attributes.status'))
    }
    if (!(data.attributes.status in CognitoSMSStatus)) {
      return reject(
        new ClientFacingError(
          `Invalid status "${data.attributes.status}". Must be one of: ${Object.keys(
            CognitoSMSStatus
          ).join('|')}`
        )
      )
    }
    if (
      !data.relationships ||
      !data.relationships.profile ||
      !data.relationships.profile.data ||
      !data.relationships.profile.data.id
    ) {
      return reject(new ClientFacingError('Missing cognito profile'))
    }

    return resolve({
      smsVerification: data.id,
      cognitoProfile: data.relationships.profile.data.id,
      verificationStatus: data.attributes.status,
    })
  })
