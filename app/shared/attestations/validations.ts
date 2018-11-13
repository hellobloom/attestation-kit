import {HashingLogic} from '@bloomprotocol/attestations-lib-v2'
import * as U from '@shared/utils'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {serverLogger} from '@shared/logger'

const ethSigUtil = require('eth-sig-util')

export type TSignedAgreementRequestPayload = HashingLogic.IAgreementParameters & {
  attestationId: string
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
    HashingLogic.getAttestationAgreement({
      subject: signedAgreement.subject,
      attester: signedAgreement.attester,
      requester: signedAgreement.requester,
      dataHash: signedAgreement.dataHash,
      nonce: signedAgreement.nonce,
    })
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
