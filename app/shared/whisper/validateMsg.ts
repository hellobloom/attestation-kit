import {Negotiation, NegotiationMsg} from '@shared/models'
import BigNumber from 'bignumber.js'
import {bufferToHex} from 'ethereumjs-util'
import {log} from '@shared/logger'

import {recoverSessionIDSig} from '@shared/ethereum/signingLogic'
import {
  IAttestationBid,
  ISolicitation,
  IPaymentAuthorization,
} from '@shared/whisper/msgTypes'
import {checkEscrowBalance} from '@shared/attestations/attestationMarketplace'
import {PersistDataTypes} from '@shared/whisper/persistDataHandler'
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

  console.log(`DEBUG IAA recovered: ${attesterAddress}`)

  return allowEntity(
    bufferToHex(attesterAddress),
    bufferToHex(negotiation.attestationTopic),
    'attester'
  )
}

export const isApprovedRequester = async (
  data: IPaymentAuthorization
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
  log('Checking if bid matches ask...', {level: 'debug'})
  if (negotiation.initialReward.comparedTo(new BigNumber(data.rewardBid)) === 0) {
    return true
  } else {
    return false
  }
}

export const rewardMatchesBid = async (
  data: IPaymentAuthorization
): Promise<boolean> => {
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
  log('Confirming requester funds...', {level: 'debug'})
  const requesterAddress = recoverSessionIDSig(data.session, data.sessionSigned)
  const balance = await checkEscrowBalance(requesterAddress)
  log(`Got requester balance for ${requesterAddress}: ${balance.toString()}`, {
    level: 'debug',
  })
  if (balance.greaterThanOrEqualTo(new BigNumber(data.rewardAsk))) {
    return true
  } else {
    return false
  }
}
