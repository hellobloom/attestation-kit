import {validateWebhookData} from './validations'
import {ClientFacingError} from '@shared/renderError'

it('validateWebhookData', async () => {
  // Rejections
  await expect(validateWebhookData({})).rejects.toEqual(
    new ClientFacingError('Missing attributes')
  )
  await expect(validateWebhookData({attributes: ''})).rejects.toEqual(
    new ClientFacingError('Attributes must be an object')
  )
  await expect(validateWebhookData({attributes: {}})).rejects.toEqual(
    new ClientFacingError('Missing id')
  )
  await expect(validateWebhookData({id: 'abc', attributes: {}})).rejects.toEqual(
    new ClientFacingError('Missing attributes.status')
  )
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'foobar'},
    })
  ).rejects.toEqual(
    new ClientFacingError(
      'Invalid status "foobar". Must be one of: pending|delivered|failed_to_deliver|verified|expired'
    )
  )

  // Happy path, with valid statuses
  const cognitoProfile = 'prf_xxxxxxxxxxxxxx'
  const relationships = {
    profile: {data: {type: 'profile', id: cognitoProfile}},
  }
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'pending'},
      relationships,
    })
  ).resolves.toEqual({
    smsVerification: 'abc',
    verificationStatus: 'pending',
    cognitoProfile,
  })
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'delivered'},
      relationships,
    })
  ).resolves.toEqual({
    smsVerification: 'abc',
    verificationStatus: 'delivered',
    cognitoProfile,
  })
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'verified'},
      relationships,
    })
  ).resolves.toEqual({
    smsVerification: 'abc',
    verificationStatus: 'verified',
    cognitoProfile,
  })
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'expired'},
      relationships,
    })
  ).resolves.toEqual({
    smsVerification: 'abc',
    verificationStatus: 'expired',
    cognitoProfile,
  })
  await expect(
    validateWebhookData({
      id: 'abc',
      attributes: {status: 'failed_to_deliver'},
      relationships,
    })
  ).resolves.toEqual({
    smsVerification: 'abc',
    verificationStatus: 'failed_to_deliver',
    cognitoProfile,
  })
})
