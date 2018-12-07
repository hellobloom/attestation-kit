import * as newrelic from 'newrelic'
import {serverLogger} from '@shared/logger'
const uuid = require('uuidv4')
import * as Wallet from 'ethereumjs-wallet'
import BigNumber from 'bignumber.js'
import {
  IMessageDecision,
  TMsgHandler,
  // Entities,
} from '@shared/whisper/msgHandler'
import {WhisperFilters, Attestation} from '@shared/models'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {newBroadcastSession, toTopic} from '@shared/whisper'
import {
  EMsgTypes,
  ISolicitation,
  IAttestationBid,
  IPaymentAuthorization,
} from '@shared/whisper/msgTypes'
import {
  MessageSubscribers,
  IDirectMessageSubscriber,
} from '@shared/whisper/subscriptionHandler'
import {signSessionID} from '@shared/ethereum/signingLogic'
import {
  IAttestationBidStore,
  PersistDataTypes,
} from '@shared/whisper/persistDataHandler'
import {rewardMatchesBid, isApprovedRequester} from '@shared/whisper/validateMsg'
import {hashedTopicToAttestationType} from '@shared/attestations/AttestationUtils'
import * as Web3 from 'web3'
import {AttestationStatus} from '@bloomprotocol/attestations-lib'
import {notifyCollectData} from '@shared/webhookHandler'
import {validatePaymentSig} from '@shared/attestations/validateAttestParams'
import {env} from '@shared/environment'

export const listenForSolicitations = async (
  listeningTopic: string,
  password: string,
  attester: string
) => {
  const filter = await WhisperFilters.findOne({
    where: {topic: toBuffer(listeningTopic), entity: attester},
    logging: env.logs.whisper.sql,
  })
  if (filter === null) {
    // This can't use a delayed job or tons will fill up the queue if redis is bogged down
    newrelic.recordCustomEvent('WhisperEvent', {
      Action: 'ListenForSolicitations',
      Topic: listeningTopic,
    })
    await newBroadcastSession(listeningTopic, password, attester)
  }
}

export const handleSolicitation: TMsgHandler = async (
  message: ISolicitation,
  messageTopic: string,
  attesterWallet: Wallet.Wallet
) => {
  let decision: IMessageDecision
  // replyTo: indicate that a new key should be generated
  const newSession = uuid()
  // Bid acceptance would come through channel based on new session and new privkey
  const newTopic = toTopic(newSession)

  const attestationType = hashedTopicToAttestationType[messageTopic]

  if (!env.attester_rewards) {
    throw new Error(
      'Could not handle solicitation - attester_rewards env variable missing'
    )
  }

  const acceptableReward = new BigNumber(
    Web3.prototype.toWei(env.attester_rewards[attestationType], 'ether')
  )

  const askReward = new BigNumber(message.rewardAsk)
  if (acceptableReward.greaterThan(askReward)) {
    // future nice-to-have - Reply with acceptable bid
    return false
  }

  const attestationBid: IAttestationBid = {
    replyTo: 'new', // Message handler will generate new keypair before sending
    session: newSession,
    reSession: message.session,
    reSessionSigned: signSessionID(message.session, attesterWallet.getPrivateKey()),
    negotiationSession: message.session,
    messageType: EMsgTypes.attestationBid,
    rewardBid: message.rewardAsk,
  }

  const newSubscription: IDirectMessageSubscriber = {
    messageType: MessageSubscribers.directMessage,
    topic: newTopic,
    publicKey: 'new',
  }

  const recipient: IDirectMessageSubscriber = {
    messageType: MessageSubscribers.directMessage,
    topic: toTopic(message.session),
    publicKey: message.replyTo,
  }

  const bid: BigNumber = new BigNumber(message.rewardAsk)
  const persistData: IAttestationBidStore = {
    messageType: PersistDataTypes.storeAttestationBid,
    session: newSession,
    reward: bid,
    topic: newTopic,
    negotiationSession: attestationBid.reSession,
    reSession: message.session,
    type: attestationType,
  }

  decision = {
    unsubscribeFrom: null, // Don't unsubscribe from general channel with solicitations
    subscribeTo: newSubscription,
    respondTo: recipient,
    respondWith: attestationBid,
    persist: persistData,
  }
  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'Bid',
    NegotiationSession: message.session,
  })
  return decision
}

export const handlePaymentAuthorization: TMsgHandler = async (
  message: IPaymentAuthorization,
  messageTopic: string,
  attesterWallet: Wallet.Wallet
) => {
  serverLogger.info(
    'DEBUG [handlePaymentAuthorization] ' +
      JSON.stringify({message, messageTopic, attesterWallet})
  )
  const _isApprovedRequester = await isApprovedRequester(message)
  const _rewardMatchesBid = await rewardMatchesBid(message)
  const _validatePaymentSig = await validatePaymentSig(
    env.tokenEscrowMarketplace.address,
    message.requester,
    message.attester,
    message.reward,
    message.paymentNonce,
    message.paymentSig
  )
  serverLogger.info(
    `_isApprovedRequester = ${_isApprovedRequester} _rewardMatchesBid = ${_rewardMatchesBid}
    _validatePaymentSig = ${_validatePaymentSig}
    `
  )
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: message.negotiationSession,
      role: 'attester',
    },
  })
  if (!attestation) {
    throw new Error(
      'Could not find attestation by negotiation session in handlePaymentAuthorization'
    )
  }

  await attestation.update({
    attester: toBuffer(message.attester),
    requester: toBuffer(message.requester),
    paymentNonce: message.paymentNonce,
    paymentSig: toBuffer(message.paymentSig),
    status: AttestationStatus.ready,
  })

  serverLogger.info(`nonce ${attestation.paymentNonce}`)

  if (_isApprovedRequester && _rewardMatchesBid && _validatePaymentSig) {
    await notifyCollectData(
      {
        status: attestation.status,
        attester: bufferToHex(attestation.attester),
        requester: bufferToHex(attestation.requester),
        nonce: attestation.paymentNonce,
        negotiationId: attestation.negotiationId,
      },
      'v2'
    )
  } else {
    serverLogger.info(
      `Message rejected.  Approved requester: ${_isApprovedRequester}; Reward matches bid: ${_rewardMatchesBid}; `
    )
  }
  return false
}
