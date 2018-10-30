import {Negotiation, NegotiationMsg} from '@shared/models'
import BigNumber from 'bignumber.js'
import {bufferToHex} from 'ethereumjs-util'
import {serverLogger} from '@shared/logger'

import {recoverSessionIDSig} from '@shared/ethereum/signingLogic'
import {
  IAttestationBid,
  ISolicitation,
  ISendJobDetails,
} from '@shared/attestations/whisperMessageTypes'
import {checkEscrowBalance} from '@shared/attestations/attestationMarketplace'
import {PersistDataTypes} from '@shared/attestations/whisperPersistDataHandler'
import {allowEntity} from '@shared/attestations/AttestationUtils'

export const isApprovedAttester = async (
  data: IAttestationBid
): Promise<boolean> => {
  const negotiation = await Negotiation.findOne({
    where: {id: data.negotiationSession},
  })
  if (negotiation === null) return false
  if (negotiation.attestationTopic === null) return false

  const attesterAddress = recoverSessionIDSig(data.reSession, data.reSessionSigned)

  return allowEntity(
    bufferToHex(attesterAddress),
    bufferToHex(negotiation.attestationTopic),
    'attester'
  )
}

export const isApprovedRequester = async (
  data: ISendJobDetails
): Promise<boolean> => {
  const negotiation = await Negotiation.findOne({
    where: {id: data.negotiationSession},
  })
  if (negotiation === null) return false
  if (negotiation.attestationTopic === null) return false

  const requesterAddress = recoverSessionIDSig(data.reSession, data.reSessionSigned)

  return allowEntity(
    bufferToHex(requesterAddress),
    bufferToHex(negotiation.attestationTopic),
    'requester'
  )
}

export const bidMatchesAsk = async (data: IAttestationBid): Promise<boolean> => {
  const negotiation = await Negotiation.findOne({
    where: {id: data.negotiationSession},
  })
  if (negotiation === null) return false
  if (negotiation.initialReward === null) return false
  serverLogger.debug('Checking if bid matches ask...')
  if (negotiation.initialReward.comparedTo(new BigNumber(data.rewardBid)) === 0) {
    return true
  } else {
    return false
  }
}

export const rewardMatchesBid = async (data: ISendJobDetails): Promise<boolean> => {
  const bidMessage = await NegotiationMsg.findOne({
    where: {
      negotiationId: data.negotiationSession,
      messageType: PersistDataTypes.storeAttestationBid,
    },
  })
  if (bidMessage === null) return false
  if (bidMessage.bid === null) return false
  if (bidMessage.bid.comparedTo(new BigNumber(data.reward)) === 0) {
    return true
  } else {
    return false
  }
}

export const confirmRequesterFunds = async (
  data: ISolicitation
): Promise<boolean> => {
  serverLogger.debug('Confirming requester funds...')
  const requesterAddress = recoverSessionIDSig(data.session, data.sessionSigned)
  const balance = await checkEscrowBalance(requesterAddress)
  serverLogger.debug('Confirmed requester funds')
  if (balance.comparedTo(new BigNumber(data.rewardAsk)) === 1) {
    return true
  } else {
    return false
  }
}
