import * as newrelic from 'newrelic'
import {serverLogger} from '@shared/logger'
const uuid = require('uuidv4')
import * as Wallet from 'ethereumjs-wallet'
import BigNumber from 'bignumber.js'
import {
  IMessageDecision,
  TMessageHandler,
  // Entities,
} from '@shared/attestations/whisperMessageHandler'
import {WhisperFilters, Attestation} from '@shared/models'
import {toBuffer} from 'ethereumjs-util'
import {newBroadcastSession, toTopic} from '@shared/attestations/whisper'
import {
  MessageTypes,
  ISolicitation,
  IAttestationBid,
  ISendJobDetails,
} from '@shared/attestations/whisperMessageTypes'
import {
  MessageSubscribers,
  IDirectMessageSubscriber,
} from '@shared/attestations/whisperSubscriptionHandler'
import {signSessionID, recoverSessionIDSig} from '@shared/ethereum/signingLogic'
import {
  IAttestationBidStore,
  PersistDataTypes,
  IStartAttestationStore,
  IStoreJobDetails,
} from '@shared/attestations/whisperPersistDataHandler'
import {
  rewardMatchesBid,
  isApprovedRequester,
} from '@shared/attestations/whisperValidateMessage'
import {validateSubjectData} from '@shared/attestations/validateJobDetails'
import {
  IPerformAttestation,
  ExternalActionTypes,
} from '@shared/attestations/whisperExternalActionHandler'
import {hashedTopicToAttestationType} from '@shared/attestations/AttestationUtils'
import {env} from '@shared/environment'
import * as Web3 from 'web3'

export const listenForSolicitations = async (
  listeningTopic: string,
  password: string,
  attester: string
) => {
  const filter = await WhisperFilters.findOne({
    where: {topic: toBuffer(listeningTopic), entity: attester},
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
  messageTopic: string
) => {
  const decision: IMessageDecision = {
    unsubscribeFrom: messageTopic,
    subscribeTo: null,
    respondTo: null,
    respondWith: null,
    persist: null,
    externalAction: null,
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'RejectJob',
    NegotiationSession: message.negotiationSession,
  })
  return decision
}

export const handleSolicitation: TMessageHandler = async (
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
    messageType: MessageTypes.attestationBid,
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
  attestationId: string
) => {
  const jobDetails: IStoreJobDetails = {
    subject: message.subjectAddress,
    attester: attesterWallet.getAddressString(),
    requester: recoverSessionIDSig(message.reSession, message.reSessionSigned),
    subjectData: message.subjectData,
    subjectRequestNonce: message.subjectRequestNonce,
    type: hashedTopicToAttestationType[messageTopic],
    typeIds: message.typeIds,
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
  }

  newrelic.recordCustomEvent('WhisperEvent', {
    Action: 'StartAttestation',
    NegotiationSession: message.negotiationSession,
  })
  return decision
}

export const handleJobDetails: TMessageHandler = async (
  message: ISendJobDetails,
  messageTopic: string,
  attesterWallet: Wallet.Wallet
) => {
  try {
    let decision: IMessageDecision
    const _isApprovedRequester = await isApprovedRequester(message)
    const _rewardMatchesBid = await rewardMatchesBid(message)
    const _validateSubjectData = validateSubjectData(
      message.subjectData,
      message.typeIds
    )

    const attestation = await Attestation.findOne({
      where: {
        negotiationId: message.negotiationSession,
        role: 'attester',
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
        attestation.id
      )
    } else {
      serverLogger.info(
        `Message rejected.  Approved requester: ${_isApprovedRequester}; Reward matches bid: ${_rewardMatchesBid}; validateSubjectData: ${_validateSubjectData} `
      )
      decision = rejectAttestationJob(message, messageTopic)
    }
    return decision
  } catch (err) {
    throw err
  }
}
