import * as newrelic from 'newrelic'
const uuid = require('uuidv4')
import BigNumber from 'bignumber.js'
import * as Wallet from 'ethereumjs-wallet'
import {toBuffer} from 'ethereumjs-util'

import {IMessageDecision, TMsgHandler} from '@shared/whisper/msgHandler'
import {
  EMsgTypes,
  ISolicitation,
  IAttestationBid,
  ISendJobDetails,
  ISubmitSubjectData,
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
  generateSigNonce,
} from '@shared/ethereum/signingLogic'
import {toTopic} from '@shared/whisper'
import {
  ISolicitationStore,
  IAwaitSubjectDataStore,
  ISendPaymentAuthorizationStore,
  PersistDataTypes,
  ISendJobDetailsStore,
} from '@shared/whisper/persistDataHandler'
import {actOnMessage, Entities} from '@shared/whisper/msgHandler'
import {serverLogger} from '@shared/logger'
import {bidMatchesAsk, isApprovedAttester} from '@shared/whisper/validateMsg'
import {
  ICollectSubjectData,
  ExternalActionTypes,
} from '@shared/whisper/externalActionHandler'
import {NegotiationMsg, Attestation} from '@shared/models'

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
    externalAction: null,
  }
  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'Solicitation',
    Topic: topic,
    NegotiationSession: newSession,
  })
  await actOnMessage(messageDecision, Entities.requester)
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
    externalAction: null,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'RejectBid',
    NegotiationSession: message.negotiationSession,
  })
  return messageDecision
}

export const waitForSubjectData = (
  message: IAttestationBid,
  messageTopic: string,
  requesterWallet: Wallet.Wallet
) => {
  const persistData: IAwaitSubjectDataStore = {
    messageType: PersistDataTypes.storeAwaitSubjectData,
    session: uuid(),
    reSession: message.session,
    replyTo: message.replyTo,
    negotiationSession: message.negotiationSession,
    reward: new BigNumber(message.rewardBid),
  }

  const collectSubjectData: ICollectSubjectData = {
    actionType: ExternalActionTypes.awaitSubjectData,
    negotiationSession: message.negotiationSession,
    attester: recoverSessionIDSig(message.reSession, message.reSessionSigned),
    requester: requesterWallet.getAddressString(),
  }

  const messageDecision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: persistData,
    externalAction: collectSubjectData,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'WaitForSubjectData',
    NegotiationSession: message.negotiationSession,
  })
  return messageDecision
}

const sendPaymentAuthorization = (
  message: IAttestationBid,
  messageTopic: string,
  requesterWallet: Wallet.Wallet
) => {
  const paymentNonce = generateSigNonce()
  const attesterAddress = recoverSessionIDSig(
    message.reSession,
    message.reSessionSigned
  )

  const paymentSig = signPaymentAuthorization(
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
    externalAction: null,
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

export const sendJobDetails = async (
  request_message: any,
  requesterWallet: Wallet.Wallet
) => {
  serverLogger.debug('Sending job details...')
  let decision: IMessageDecision
  const attestation = await Attestation.findById(request_message.attestationId)

  if (!attestation) {
    throw new Error('No such attestation in sendJobDetails')
  }

  attestation.update({
    requestNonce: request_message.requestNonce,
    data: request_message.data,
    subjectSig: toBuffer(request_message.subjectSig),
  })

  const negotiationMsg = await NegotiationMsg.findOne({
    where: {
      negotiationId: attestation.negotiationId,
      messageType: PersistDataTypes.storeAwaitSubjectData,
    },
  })

  if (!negotiationMsg) {
    serverLogger.error(`Couldn't find matching NegotiationMsg in SendJobDetails`)
    throw new Error('No such negotiationMsg in sendJobDetails')
  }

  const message: ISubmitSubjectData = {
    messageType: EMsgTypes.sendJobDetails,
    replyTo: negotiationMsg.replyTo,
    session: negotiationMsg.uuid,
    negotiationSession: negotiationMsg.negotiationId,
    reSession: negotiationMsg.regardingUuid,
    reSessionSigned: '',
    reward: negotiationMsg.bid.toString(10), // negotiationMsg.bid,
  }

  const newSession = message.session
  const newTopic = toTopic(newSession) // The topic attestation requests will come in on

  const paymentNonce = generateSigNonce()

  const jobDetails = await Attestation.findAndValidateJobDetails(
    message.negotiationSession,
    'requester'
  )

  if (jobDetails.kind === 'validated') {
    const paymentSig = signPaymentAuthorization(
      requesterWallet.getAddressString(),
      jobDetails.data.attester,
      message.reward,
      paymentNonce,
      requesterWallet.getPrivateKey()
    )

    const messageResponse: ISendJobDetails = {
      messageType: EMsgTypes.sendJobDetails,
      replyTo: 'new',
      session: newSession,
      reSession: message.session,
      reSessionSigned: signSessionID(
        message.session,
        requesterWallet.getPrivateKey()
      ),
      negotiationSession: message.negotiationSession,
      reward: message.reward,
      subjectData: jobDetails.data.data,
      subjectRequestNonce: jobDetails.data.requestNonce,
      typeIds: jobDetails.data.types,
      subjectAddress: jobDetails.data.subject,
      subjectSignature: jobDetails.data.subjectSig,
      paymentSignature: paymentSig,
      paymentNonce: paymentNonce,
    }

    const newSubscription: IDirectMessageSubscriber = {
      messageType: MessageSubscribers.directMessage,
      topic: newTopic,
      publicKey: 'new',
    }

    const recipient: IDirectMessageSubscriber = {
      messageType: MessageSubscribers.directMessage,
      topic: toTopic(message.reSession),
      publicKey: message.replyTo,
    }

    const persistData: ISendJobDetailsStore = {
      messageType: PersistDataTypes.storeSendJobDetails,
      session: newSession,
      reSession: message.session,
      reward: new BigNumber(message.reward),
      topic: newTopic,
      negotiationSession: message.negotiationSession,
      paymentNonce: paymentNonce,
    }

    decision = {
      unsubscribeFrom: null,
      subscribeTo: newSubscription,
      respondTo: recipient,
      respondWith: messageResponse,
      persist: persistData,
      externalAction: null,
    }
    newrelic.recordCustomEvent('WhisperEvent', {
      Action: 'SendJobDetails',
      NegotiationSession: message.negotiationSession,
    })
    await actOnMessage(decision, Entities.requester)
  } else {
    throw new Error('Sending job details failed')
  }
}
