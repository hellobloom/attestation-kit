import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import {
  handleSolicitation,
  handleJobDetails,
} from '@shared/attestations/whisperAttesterActions'
import {
  ISolicitation,
  ISendJobDetails,
  MessageTypes,
} from '@shared/attestations/whisperMessageTypes'
import {NegotiationMsg} from '@shared/models'
import {MessageSubscribers} from '@shared/attestations/whisperSubscriptionHandler'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import * as Wallet from 'ethereumjs-wallet'
import {signSessionID, signPaymentAuthorization} from '@shared/ethereum/signingLogic'
import {PersistDataTypes} from '@shared/attestations/whisperPersistDataHandler'
import {signAttestationRequest} from '@shared/ethereum/signingLogic'
import {
  attesterWallet,
  requesterWallet,
} from '@shared/attestations/attestationWallets'
import {ExternalActionTypes} from '@shared/attestations/whisperExternalActionHandler'
import {HashingLogic} from '@bloomprotocol/attestations-lib'

const subjectPrivKey =
  '0xf90c991bd33e54abe929463e24c0d315abcf03a5ef1e628d587615371af8dff3'

const subjectWallet: Wallet.Wallet = Wallet.fromPrivateKey(toBuffer(subjectPrivKey))
const subjectAddress = subjectWallet.getAddressString()

jest.mock('newrelic', () => ({recordCustomEvent: jest.fn()}))

beforeEach(() => {
  jest.clearAllMocks()
})

const solicitationSessionId = uuid()
const zeroReward = new BigNumber(0).toString(10)
const solicitationReplyTo = 'testPublicKey'

const solicitationMessage: ISolicitation = {
  messageType: MessageTypes.solicitation,
  replyTo: solicitationReplyTo,
  session: solicitationSessionId,
  negotiationSession: solicitationSessionId,
  sessionSigned: signSessionID(
    solicitationSessionId,
    requesterWallet.getPrivateKey()
  ),
  rewardAsk: zeroReward,
}

describe('Handling Solicitation', () => {
  it('Bids on a solicitation', async () => {
    const decision = await handleSolicitation(
      solicitationMessage,
      'testTopic',
      attesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom', null)
    expect(decision).toHaveProperty(
      'subscribeTo.messageType',
      MessageSubscribers.directMessage
    )
    expect(decision).toHaveProperty(
      'respondTo.messageType',
      MessageSubscribers.directMessage
    )
    expect(decision).toHaveProperty(
      'respondWith.messageType',
      MessageTypes.attestationBid
    )
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeAttestationBid
    )
    expect(decision).toHaveProperty('externalAction', null)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'Bid',
      NegotiationSession: solicitationMessage.session,
    })
  })
})

const newSessionId = uuid()
const phoneNonce = uuid()
const emailNonce = uuid()
const requestNonce = uuid()
const paymentNonce = uuid()

const phoneData: HashingLogic.IAttestationData = {
  type: 'phone',
  provider: 'Bloom',
  data: '12223334444',
  nonce: phoneNonce,
  version: '1.0.0',
}

const emailData: HashingLogic.IAttestationData = {
  type: 'email',
  provider: 'Bloom',
  data: 'abc@google.com',
  nonce: emailNonce,
  version: '1.0.0',
}

const hashedData = bufferToHex(
  HashingLogic.getMerkleTree([phoneData, emailData]).getRoot()
)

const subjectSig = signAttestationRequest(
  subjectAddress,
  attesterWallet.getAddressString(),
  requesterWallet.getAddressString(),
  hashedData,
  [0, 1],
  requestNonce,
  toBuffer(subjectPrivKey)
)

const paymentSig = signPaymentAuthorization(
  requesterWallet.getAddressString(),
  attesterWallet.getAddressString(),
  zeroReward,
  paymentNonce,
  requesterWallet.getPrivateKey()
)

const validJobDetails: ISendJobDetails = {
  messageType: MessageTypes.sendJobDetails,
  replyTo: 'testReplyTo',
  session: uuid(),
  reSession: newSessionId,
  reSessionSigned: signSessionID(newSessionId, requesterWallet.getPrivateKey()),
  negotiationSession: solicitationSessionId,
  reward: zeroReward,
  subjectAddress: subjectAddress,
  subjectData: {data: [phoneData, emailData]},
  subjectRequestNonce: requestNonce,
  typeIds: [0, 1],
  subjectSignature: subjectSig,
  paymentSignature: paymentSig,
  paymentNonce: paymentNonce,
}

const invalidJobDetails: ISendJobDetails = {
  messageType: MessageTypes.sendJobDetails,
  replyTo: 'testReplyTo',
  session: uuid(),
  reSession: newSessionId,
  reSessionSigned: signSessionID(newSessionId, requesterWallet.getPrivateKey()),
  negotiationSession: solicitationSessionId,
  reward: zeroReward,
  subjectAddress: '0x2',
  subjectData: {data: [phoneData, emailData]},
  subjectRequestNonce: requestNonce,
  typeIds: [0, 1],
  subjectSignature: subjectSig,
  paymentSignature: paymentSig,
  paymentNonce: paymentNonce,
}

describe('Handling job details', () => {
  it('Accepts a valid attestation job', async () => {
    NegotiationMsg.findOne = jest.fn(() => ({bid: new BigNumber(0)}))
    const decision = await handleJobDetails(
      validJobDetails,
      'testTopic',
      attesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeStartAttestation
    )
    expect(decision).toHaveProperty(
      'externalAction.actionType',
      ExternalActionTypes.performAttestation
    )

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'StartAttestation',
      NegotiationSession: validJobDetails.negotiationSession,
    })
  })
  it('Rejects if invalid job details', async () => {
    NegotiationMsg.findOne = jest.fn(() => ({bid: new BigNumber(0)}))
    const decision = await handleJobDetails(
      invalidJobDetails,
      'testTopic',
      attesterWallet
    )
    expect(decision).toHaveProperty('unsubscribeFrom', 'testTopic')
    expect(decision).toHaveProperty('subscribeTo', null)
    expect(decision).toHaveProperty('respondTo', null)
    expect(decision).toHaveProperty('respondWith', null)
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeStartAttestation
    )
    expect(decision).toHaveProperty(
      'externalAction.actionType',
      ExternalActionTypes.performAttestation
    )

    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'StartAttestation',
      NegotiationSession: validJobDetails.negotiationSession,
    })
  })
})
