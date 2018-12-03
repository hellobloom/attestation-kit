import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import * as Wallet from 'ethereumjs-wallet'
import {env} from '@shared/environment'

import {IMessageDecision, TMsgHandler} from '@shared/whisper/msgHandler'
import {
  EMsgTypes,
  ISolicitation,
  IAttestationBid,
  IPaymentAuthorization,
} from '@shared/whisper/msgTypes'
import {
  MessageSubscribers,
  IDirectMessageSubscriber,
  IBroadcastSubscriber,
} from '@shared/whisper/subscriptionHandler'
import {
  recoverSessionIDSig,
  signSessionID,
  signPaymentAuthorization,
} from '@shared/ethereum/signingLogic'
import {toTopic} from '@shared/whisper'
import {
  ISolicitationStore,
  ISendPaymentAuthorizationStore,
  PersistDataTypes,
} from '@shared/whisper/persistDataHandler'
import {actOnMessage} from '@shared/whisper/msgHandler'
import {serverLogger} from '@shared/logger'
import {bidMatchesAsk, isApprovedAttester} from '@shared/whisper/validateMsg'
import {HashingLogic} from '@bloomprotocol/attestations-lib'

export const initiateSolicitation = async (
  attestationId: string,
  reward: BigNumber,
  topic: string,
  symKeyPassword: string,
  requesterWallet: Wallet.Wallet,
  newSession: string
) => {
  serverLogger.debug('Initiating solicitation...')
  const newTopic = toTopic(newSession) // The topic attestation bids will come in on
  const newSubscription: IDirectMessageSubscriber = {
    messageType: MessageSubscribers.directMessage,
    topic: newTopic,
    publicKey: 'new',
  }

  const solicitation: ISolicitation = {
    messageType: EMsgTypes.solicitation,
    replyTo: 'new',
    session: newSession,
    negotiationSession: newSession,
    sessionSigned: signSessionID(newSession, requesterWallet.getPrivateKey()),
    rewardAsk: reward.toString(10),
  }

  const recipient: IBroadcastSubscriber = {
    messageType: MessageSubscribers.broadcastMessage,
    topic: topic,
    password: symKeyPassword,
  }

  const persistData: ISolicitationStore = {
    attestationId: attestationId,
    messageType: PersistDataTypes.storeSolicitation,
    session: newSession,
    reward: reward,
    topic: newTopic,
    negotiationSession: newSession,
    attestationTopic: topic,
  }

  const messageDecision: IMessageDecision = {
    unsubscribeFrom: null,
    subscribeTo: newSubscription,
    respondTo: recipient,
    respondWith: solicitation,
    persist: persistData,
  }
  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'Solicitation',
    Topic: topic,
    NegotiationSession: newSession,
  })
  await actOnMessage(messageDecision, 'requester')
}

export const rejectAttestationBid = (
  message: IAttestationBid,
  messageTopic: string
) => {
  const messageDecision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: null,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'RejectBid',
    NegotiationSession: message.negotiationSession,
  })
  return messageDecision
}

const sendPaymentAuthorization = (
  message: IAttestationBid,
  messageTopic: string,
  requesterWallet: Wallet.Wallet
) => {
  const paymentNonce = HashingLogic.generateNonce()
  const attesterAddress = recoverSessionIDSig(
    message.reSession,
    message.reSessionSigned
  )

  const paymentSig = signPaymentAuthorization(
    env.attestationContracts.logicAddress,
    requesterWallet.getAddressString(),
    attesterAddress,
    message.rewardBid,
    paymentNonce,
    requesterWallet.getPrivateKey()
  )
  const newSession = uuid()

  const persistData: ISendPaymentAuthorizationStore = {
    messageType: PersistDataTypes.storeSendPaymentAuthorization,
    session: newSession,
    reSession: message.session,
    negotiationSession: message.negotiationSession,
    reward: new BigNumber(message.rewardBid),
    paymentNonce: paymentNonce,
    paymentSig: paymentSig,
  }

  const recipient: IDirectMessageSubscriber = {
    messageType: MessageSubscribers.directMessage,
    topic: toTopic(message.session),
    publicKey: message.replyTo,
  }

  const messageResponse: IPaymentAuthorization = {
    messageType: EMsgTypes.paymentAuthorization,
    replyTo: 'new', // Dont want a response
    session: newSession,
    reSession: message.session,
    reSessionSigned: signSessionID(message.session, requesterWallet.getPrivateKey()),
    negotiationSession: message.negotiationSession,
    attester: attesterAddress,
    requester: requesterWallet.getAddressString(),
    reward: message.rewardBid,
    paymentSig: paymentSig,
    paymentNonce: paymentNonce,
  }

  const messageDecision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: recipient,
    respondWith: messageResponse,
    persist: persistData,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'SendPaymentAuthorization',
    NegotiationSession: message.negotiationSession,
  })
  return messageDecision
}

export const handleAttestationBid: TMsgHandler = async (
  message: IAttestationBid,
  messageTopic: string,
  requesterWallet: Wallet.Wallet
) => {
  serverLogger.info(
    'DEBUG [handleAttestationBid] ' +
      JSON.stringify({message, messageTopic, requesterWallet})
  )
  let decision: IMessageDecision
  const approvedAttester = await isApprovedAttester(message)
  const bidMatch = await bidMatchesAsk(message)
  if (approvedAttester && bidMatch) {
    decision = sendPaymentAuthorization(message, messageTopic, requesterWallet)
  } else {
    serverLogger.info(
      'Bid params failed validation.  Attester approved: ',
      approvedAttester,
      '; Bid match: ',
      bidMatch
    )
    decision = await rejectAttestationBid(message, messageTopic)
  }
  return decision
}
