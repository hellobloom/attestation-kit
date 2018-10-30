import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import {handleAttestationBid} from '@shared/attestations/whisperRequesterActions'
import {
  IAttestationBid,
  MessageTypes,
} from '@shared/attestations/whisperMessageTypes'
import {Negotiation, WhisperFilters} from '@shared/models'
import {signSessionID} from '@shared/ethereum/signingLogic'
import {env} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'
// import {MessageSubscribers} from '@shared/attestations/whisperSubscriptionHandler'
import {toTopic} from '@shared/attestations/whisper'
import {Entities} from '@shared/attestations/whisperMessageHandler'
import {PersistDataTypes} from '@shared/attestations/whisperPersistDataHandler'
import {ExternalActionTypes} from '@shared/attestations/whisperExternalActionHandler'
import * as Wallet from 'ethereumjs-wallet'

const zeroReward = new BigNumber(0).toString(10)

const reSessionId = uuid()
const reSessionSigned = signSessionID(reSessionId, toBuffer(env.owner.ethPrivKey))
const negotiationSession = uuid()

const attestationBid: IAttestationBid = {
  messageType: MessageTypes.attestationBid,
  replyTo: 'testReplyTo',
  session: uuid(),
  reSession: reSessionId,
  negotiationSession: negotiationSession,
  reSessionSigned: reSessionSigned,
  rewardBid: zeroReward,
}
const invalidAttestationBid: IAttestationBid = {
  messageType: MessageTypes.attestationBid,
  replyTo: 'testReplyTo',
  session: uuid(),
  reSession: uuid(),
  negotiationSession: negotiationSession,
  reSessionSigned: reSessionSigned,
  rewardBid: zeroReward,
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

describe('Handling bid', () => {
  it('Accepts a valid sms bid', async () => {
    Negotiation.findOne = jest.fn(() => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(toTopic(env.whisper.topics.phone)),
    }))
    WhisperFilters.findOne = jest.fn(() => ({
      entity: Entities.phoneAttester,
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
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeAwaitSubjectData
    )
    expect(decision).toHaveProperty(
      'externalAction.actionType',
      ExternalActionTypes.awaitSubjectData
    )
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'WaitForSubjectData',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Accepts a valid email bid', async () => {
    Negotiation.findOne = jest.fn(() => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(toTopic(env.whisper.topics.email)),
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
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeAwaitSubjectData
    )
    expect(decision).toHaveProperty(
      'externalAction.actionType',
      ExternalActionTypes.awaitSubjectData
    )
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'WaitForSubjectData',
      NegotiationSession: attestationBid.negotiationSession,
    })
  })

  it('Rejects a bid with the wrong reward', async () => {
    Negotiation.findOne = jest.fn(() => ({
      initialReward: new BigNumber(2),
      attestationTopic: toBuffer(toTopic(env.whisper.topics.phone)),
    }))
    WhisperFilters.findOne = jest.fn(() => ({
      entity: Entities.phoneAttester,
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
    Negotiation.findOne = jest.fn(() => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(toTopic(env.whisper.topics.phone)),
    }))
    WhisperFilters.findOne = jest.fn(() => ({entity: Entities.emailAttester}))
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
    Negotiation.findOne = jest.fn(() => ({
      initialReward: new BigNumber(0),
      attestationTopic: toBuffer(toTopic(env.whisper.topics.phone)),
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
//   messageType: MessageTypes.attestationRequest,
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
//   messageType: MessageTypes.attestationRequest,
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
//     WhisperFilters.findOne = jest.fn(() => ({entity: Entities.phoneAttester}))
//     const decision = await handleAttestationRequest(attestationRequest, 'testTopic')
//     expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
//     expect(decision).toHaveProperty('subscribeTo', null)
//     expect(decision).toHaveProperty('respondTo', null)
//     expect(decision).toHaveProperty('respondWith', null)
//     expect(decision).toHaveProperty(
//       'persist.messageType',
//       MessageTypes.attestationRequestComplete
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
