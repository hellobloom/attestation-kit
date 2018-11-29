import {env} from '@shared/environment'
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import * as U from '@shared/utils'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {serverLogger} from '@shared/logger'

const ethSigUtil = require('eth-sig-util')

export type TSignedAgreementRequestPayload = {
  subject: string
  dataHash: string
  nonce: string
  negotiationId: string
  signature: string
  gasPrice: string
}

// EH TODO VALIDATE DATA NODES
export const validateDateNodes = (
  dataNodes: HashingLogic.IAttestation[]
): string[] => []

export const validateSignedAgreement = (
  signedAgreement: TSignedAgreementRequestPayload
): boolean => {
  serverLogger.info(`[validateSignedAgreement] ${JSON.stringify(signedAgreement)}`)
  const expectedDigest = ethSigUtil.typedSignatureHash(
    HashingLogic.getAttestationAgreement(
      env.attestationContracts.logicAddress,
      1,
      signedAgreement.dataHash,
      signedAgreement.nonce,
    )
  )
  const subjectEthAddress = toBuffer(signedAgreement.subject)
  const recoveredEthAddress = U.recoverEthAddressFromDigest(
    toBuffer(expectedDigest),
    signedAgreement.signature
  )
  serverLogger.info(
    `[validateSignedAgreement] recoveredEthAddress '${bufferToHex(
      recoveredEthAddress
    )}'`
  )
  return recoveredEthAddress.equals(subjectEthAddress)
}
