import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import {handleAttestationBid} from '@shared/whisper/requesterActions'
import {IAttestationBid, EMsgTypes} from '@shared/whisper/msgTypes'
import {Negotiation, WhisperFilters} from '@shared/models'
import {signSessionID} from '@shared/ethereum/signingLogic'
import {env, IEnvironmentConfig} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'
// import {MessageSubscribers} from '@shared/whisper/subscriptionHandler'
import {toTopic, getTopic} from '@shared/whisper'
import * as Wallet from 'ethereumjs-wallet'

let envPr = env()

const getAttestationBid = (e: IEnvironmentConfig, invalid: boolean = false) => {
  const zeroReward = new BigNumber(0).toString(10)
  const reSessionId = uuid()
  const reSessionSigned = signSessionID(reSessionId, toBuffer(e.owner.ethPrivKey))
  const negotiationSession = uuid()
  if (!invalid) {
    const attestationBid: IAttestationBid = {
      messageType: EMsgTypes.attestationBid,
      replyTo: 'testReplyTo',
      session: uuid(),
      reSession: reSessionId,
      negotiationSession: negotiationSession,
      reSessionSigned: reSessionSigned,
      rewardBid: zeroReward,
    }
    return attestationBid
  } else {
    const invalidAttestationBid: IAttestationBid = {
      messageType: EMsgTypes.attestationBid,
      replyTo: 'testReplyTo',
      session: uuid(),
      reSession: uuid(),
      negotiationSession: negotiationSession,
      reSessionSigned: reSessionSigned,
      rewardBid: zeroReward,
    }
    return invalidAttestationBid
  }
}
const requesterPrivKey =
  '0x96f3f9dfb9abc8e597669d9b7f9abe4c9b04b44fd7c897adbc95dad4060a4c06'

const requesterWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(requesterPrivKey)
)
// const requesterAddress = requesterWallet.getAddressString()

jest.mock('newrelic', () => ({recordCustomEvent: jest.fn()}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Handling bid', async () => {
  let e = await envPr
  let attestationBid = getAttestationBid(e)
  let invalidAttestationBid = getAttestationBid(e, true)
  it('Accepts a valid sms bid', async () => {
    Negotiation.findOne = jest.fn(async () => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(await toTopic(await getTopic('phone'))),
    }))
    WhisperFilters.findOne = jest.fn(() => ({
      entity: 'phone',
    }))
    const decision = await handleAttestationBid(
      attestationBid,
      'testTopic',
      requesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'WaitForSubjectData',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Accepts a valid email bid', async () => {
    Negotiation.findOne = jest.fn(async () => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(await toTopic(await getTopic('email'))),
    }))
    const decision = await handleAttestationBid(
      attestationBid,
      'testTopic',
      requesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'WaitForSubjectData',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Rejects a bid with the wrong reward', async () => {
    Negotiation.findOne = jest.fn(async () => ({
      initialReward: new BigNumber(2),
      attestationTopic: toBuffer(await toTopic(await getTopic('phone'))),
    }))
    WhisperFilters.findOne = jest.fn(() => ({
      entity: 'phone',
    }))
    const decision = await handleAttestationBid(
      attestationBid,
      'testTopic',
      requesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty('persist', null)
    expect(decision).toHaveProperty('externalAction', null)

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'RejectBid',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Rejects a bid if no negotiation entry found', async () => {
    Negotiation.findOne = jest.fn(() => null)
    const decision = await handleAttestationBid(
      attestationBid,
      'testTopic',
      requesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty('persist', null)
    expect(decision).toHaveProperty('externalAction', null)

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'RejectBid',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Rejects a bid with an unapproved attester', async () => {
    Negotiation.findOne = jest.fn(async () => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(await toTopic(await getTopic('phone'))),
    }))
    WhisperFilters.findOne = jest.fn(() => ({entity: 'email'}))
    const decision = await handleAttestationBid(attestationBid, 'testTopic')
    expect(decision).toHaveProperty('unsubscribeFrom')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty('persist', null)

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'RejectBid',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Rejects a bid if attester sig does not match attester address', async () => {
    Negotiation.findOne = jest.fn(async () => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(await toTopic(await getTopic('phone'))),
    }))
    const decision = await handleAttestationBid(invalidAttestationBid, 'testTopic')
    expect(decision).toHaveProperty('unsubscribeFrom')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty('persist', null)

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'RejectBid',
      NegotiationSession: invalidAttestationBid.negotiationSession,
    })
  })
})

// const signedAttestationRequest = signAttestationRequest(
//   '0x2',
//   env.cognito.ethAddress,
//   zeroReward,
//   'testDigest',
//   toBuffer(env.cognito.ethPrivKey)
// )
// const attestationRequest: IAttestationRequest = {
//   messageType: EMsgTypes.attestationRequest,
//   replyTo: 'testReplyTo',
//   session: uuid(),
//   reSession: reSessionId,
//   negotiationSession: uuid(),
//   attesterAddress: env.cognito.ethAddress,
//   attesterBloomID: 'test',
//   reSessionSigned: reSessionSigned,
//   reward: zeroReward,
//   subjectAddress: '0x2',
//   traitIDsDigest: 'testDigest',
//   signedAttestationRequest: signedAttestationRequest,
// }

// const invalidAttestationRequest: IAttestationRequest = {
//   messageType: EMsgTypes.attestationRequest,
//   replyTo: 'testReplyTo',
//   session: uuid(),
//   reSession: reSessionId,
//   negotiationSession: uuid(),
//   attesterAddress: '0x1',
//   attesterBloomID: 'test',
//   reSessionSigned: reSessionSigned,
//   reward: zeroReward,
//   subjectAddress: '0x2',
//   traitIDsDigest: 'testDigest',
//   signedAttestationRequest: signedAttestationRequest,
// }

// describe('Handling bid', () => {
//   it('Accepts a attestation request', async () => {
//     Negotiation.findOne = jest.fn(() => ({
//       initialReward: new BigNumber(0),
//       attestationTopic: toBuffer(toTopic(env.whisper.whisperTopicSMS)),
//     }))
//     WhisperFilters.findOne = jest.fn(() => ({entity: 'phone'}))
//     const decision = await handleAttestationRequest(attestationRequest, 'testTopic')
//     expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
//     expect(decision).toHaveProperty('subscribeTo', null)
//     expect(decision).toHaveProperty('respondTo', null)
//     expect(decision).toHaveProperty('respondWith', null)
//     expect(decision).toHaveProperty(
//       'persist.messageType',
//       EMsgTypes.attestationRequestComplete
//     )

//     expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
//     expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
//       Action: 'AcceptSignedRequest',
//       NegotiationSession: attestationRequest.negotiationSession,
//     })
//   })
//   it('Rejects if reward does not match original reward', async () => {
//     Negotiation.findOne = jest.fn(() => ({
//       initialReward: new BigNumber(2),
//       attestationTopic: toBuffer(toTopic(env.whisper.whisperTopicSMS)),
//     }))
//     const decision = await handleAttestationRequest(attestationRequest, 'testTopic')
//     expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
//     expect(decision).toHaveProperty('subscribeTo', null)
//     expect(decision).toHaveProperty('respondTo', null)
//     expect(decision).toHaveProperty('respondWith', null)
//     expect(decision).toHaveProperty('persist', null)

//     expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
//     expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
//       Action: 'RejectSignedRequest',
//       NegotiationSession: attestationRequest.negotiationSession,
//     })
//   })
//   it('Rejects an unapproved attester', async () => {
//     Negotiation.findOne = jest.fn(() => ({
//       initialReward: new BigNumber(0),
//       attestationTopic: toBuffer(toTopic(env.whisper.whisperTopicSMS)),
//     }))

//     WhisperFilters.findOne = jest.fn(() => ({entity: Entities.emailAttester}))
//     const decision = await handleAttestationRequest(attestationRequest, 'testTopic')
//     expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
//     expect(decision).toHaveProperty('subscribeTo', null)
//     expect(decision).toHaveProperty('respondTo', null)
//     expect(decision).toHaveProperty('respondWith', null)
//     expect(decision).toHaveProperty('persist', null)

//     expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
//     expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
//       Action: 'RejectSignedRequest',
//       NegotiationSession: attestationRequest.negotiationSession,
//     })
//   })
//   it('Rejects if sig does not match attester', async () => {
//     Negotiation.findOne = jest.fn(() => ({
//       initialReward: new BigNumber(0),
//       attestationTopic: toBuffer(toTopic(env.whisper.whisperTopicSMS)),
//     }))
//     const decision = await handleAttestationRequest(
//       invalidAttestationRequest,
//       'testTopic'
//     )
//     expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
//     expect(decision).toHaveProperty('subscribeTo', null)
//     expect(decision).toHaveProperty('respondTo', null)
//     expect(decision).toHaveProperty('respondWith', null)
//     expect(decision).toHaveProperty('persist', null)

//     expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
//     expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
//       Action: 'RejectSignedRequest',
//       NegotiationSession: invalidAttestationRequest.negotiationSession,
//     })
//   })
// })
