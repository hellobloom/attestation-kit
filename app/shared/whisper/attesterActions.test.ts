import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import {
  handleSolicitation,
} from '@shared/whisper/attesterActions'
import {
  ISolicitation,
  EMsgTypes,
} from '@shared/whisper/msgTypes'
import {MessageSubscribers} from '@shared/whisper/subscriptionHandler'
import {signSessionID} from '@shared/ethereum/signingLogic'
import {PersistDataTypes} from '@shared/whisper/persistDataHandler'
import {
  attesterWallet,
  requesterWallet,
} from '@shared/attestations/attestationWallets'


jest.mock('newrelic', () => ({recordCustomEvent: jest.fn()}))

beforeEach(() => {
  jest.clearAllMocks()
})

const solicitationSessionId = uuid()
const zeroReward = new BigNumber(0).toString(10)
const solicitationReplyTo = 'testPublicKey'

const solicitationMessage: ISolicitation = {
  messageType: EMsgTypes.solicitation,
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
      EMsgTypes.attestationBid
    )
    expect(decision).toHaveProperty(
      'persist.messageType',
      PersistDataTypes.storeAttestationBid
    )
    expect(newrelic.recordCustomEvent).toHaveBeenCalledTimes(1)
    expect(newrelic.recordCustomEvent).toHaveBeenCalledWith('WhisperEvent', {
      Action: 'Bid',
      NegotiationSession: solicitationMessage.session,
    })
  })
})
