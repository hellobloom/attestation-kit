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
import {toBuffer} from 'ethereumjs-util'
import {newBroadcastSession, toTopic} from '@shared/whisper'
import {
  EMsgTypes,
  ISolicitation,
  IAttestationBid,
  ISendJobDetails,
  IPaymentAuthorization,
} from '@shared/whisper/msgTypes'
import {
  MessageSubscribers,
  IDirectMessageSubscriber,
} from '@shared/whisper/subscriptionHandler'
import {signSessionID, recoverSessionIDSig} from '@shared/ethereum/signingLogic'
import {
  IAttestationBidStore,
  PersistDataTypes,
  IStartAttestationStore,
  IStoreJobDetails,
} from '@shared/whisper/persistDataHandler'
import {rewardMatchesBid, isApprovedRequester} from '@shared/whisper/validateMsg'
import {validateSubjectData} from '@shared/attestations/validateJobDetails'
import {
  IPerformAttestation,
  ExternalActionTypes,
  requestSubjectData,
} from '@shared/whisper/externalActionHandler'
import {hashedTopicToAttestationType} from '@shared/attestations/AttestationUtils'
import {env} from '@shared/environment'
import * as Web3 from 'web3'
import {AttestationTypeID, HashingLogic} from '@bloomprotocol/attestations-lib'
import {TVersion} from '@shared/version'
import {AttestationStatus} from '@bloomprotocol/attestations-lib-v2'

export const listenForSolicitations = async (
  listeningTopic: string,
  password: string,
  attester: string
) => {
  const filter = await WhisperFilters.findOne({
    where: {topic: toBuffer(listeningTopic), entity: attester},
    logging: !env.logs.whisper.sql,
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

const rejectAttestationJob = (
  message: ISendJobDetails | ISolicitation,
  messageTopic: string,
  version: TVersion = 'v2'
) => {
  const decision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: null,
    externalAction: null,
    version,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'RejectJob',
    NegotiationSession: message.negotiationSession,
  })
  return decision
}

export const handleSolicitation: TMsgHandler = async (
  message: ISolicitation,
  messageTopic: string,
  attesterWallet: Wallet.Wallet,
  version: TVersion
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
    externalAction: null,
    version,
  }
  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'Bid',
    NegotiationSession: message.session,
  })
  return decision
}

const startAttestation = (
  message: ISendJobDetails,
  messageTopic: string,
  attesterWallet: Wallet.Wallet,
  attestationId: string,
  version: TVersion
) => {
  const jobDetails: IStoreJobDetails = {
    subject: message.subjectAddress,
    attester: attesterWallet.getAddressString(),
    requester: recoverSessionIDSig(message.reSession, message.reSessionSigned),
    subjectData: message.subjectData,
    subjectRequestNonce: message.subjectRequestNonce,
    type: hashedTopicToAttestationType[messageTopic],
    typeIds: message.subjectData.data.map(
      (a: HashingLogic.IAttestationData) => AttestationTypeID[a.type]
    ),
    subjectSignature: message.subjectSignature,
    paymentSignature: message.paymentSignature,
    paymentNonce: message.paymentNonce,
  }
  const persistData: IStartAttestationStore = {
    messageType: PersistDataTypes.storeStartAttestation,
    session: uuid(),
    reSession: message.reSession,
    replyTo: message.replyTo,
    negotiationSession: message.negotiationSession,
    reward: new BigNumber(message.reward),
    jobDetails: jobDetails,
  }

  const performAttestation: IPerformAttestation = {
    id: attestationId,
    actionType: ExternalActionTypes.performAttestation,
    jobDetailsMessage: message,
  }

  const decision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: persistData,
    externalAction: performAttestation,
    version,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'StartAttestation',
    NegotiationSession: message.negotiationSession,
  })
  return decision
}

export const handleJobDetails: TMsgHandler = async (
  message: ISendJobDetails,
  messageTopic: string,
  attesterWallet: Wallet.Wallet,
  version: TVersion
) => {
  try {
    let decision: IMessageDecision
    const _isApprovedRequester = await isApprovedRequester(message)
    const _rewardMatchesBid = await rewardMatchesBid(message)
    const _validateSubjectData = validateSubjectData(
      message.subjectData,
      message.subjectData.data.map(
        (a: HashingLogic.IAttestationData) => AttestationTypeID[a.type]
      )
    )
    serverLogger.info(`validate output: ${_validateSubjectData}`)

    const attestation = await Attestation.findOne({
      where: {
        negotiationId: message.negotiationSession,
        role: 'attester',
        version,
      },
    })

    if (!attestation) {
      throw new Error(
        'Could not find attestation by negotiation session in handleJobDetails'
      )
    }

    if (_isApprovedRequester && _rewardMatchesBid && _validateSubjectData) {
      decision = startAttestation(
        message,
        messageTopic,
        attesterWallet,
        attestation.id,
        version
      )
    } else {
      serverLogger.info(
        `Message rejected.  Approved requester: ${_isApprovedRequester}; Reward matches bid: ${_rewardMatchesBid}; validateSubjectData: ${_validateSubjectData} `
      )
      decision = rejectAttestationJob(message, messageTopic, version)
    }
    return decision
  } catch (err) {
    throw err
  }
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
  serverLogger.info(
    `_isApprovedRequester = ${_isApprovedRequester} _rewardMatchesBid = ${_rewardMatchesBid}`
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

  if (_isApprovedRequester && _rewardMatchesBid) {
    await requestSubjectData(attestation)
  } else {
    serverLogger.info(
      `Message rejected.  Approved requester: ${_isApprovedRequester}; Reward matches bid: ${_rewardMatchesBid}; `
    )
  }
  return false
}
