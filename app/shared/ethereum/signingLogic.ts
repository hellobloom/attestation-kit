const ethSigUtil = require('eth-sig-util')
const {soliditySha3} = require('web3-utils')
import {HashingLogic} from '@bloomprotocol/attestations-lib'
const uuid = require('uuidv4')
import {bufferToHex} from 'ethereumjs-util'

interface ITypedDataParam {
  type: string
  name: string
  value: string
}

export const signAttestationRequest = (
  subject: string,
  attester: string,
  requester: string,
  dataHash: string,
  typeIds: number[],
  requestNonce: string,
  privKey: Buffer
) =>
  ethSigUtil.signTypedDataLegacy(privKey, {
    data: HashingLogic.getAttestationAgreement({
      subject,
      attester,
      requester,
      dataHash,
      typeHash: HashingLogic.hashAttestationTypes(typeIds),
      nonce: requestNonce,
    }),
  })

export const signPaymentAuthorization = (
  sender: string,
  receiver: string,
  amount: string,
  nonce: string,
  privKey: Buffer
) =>
  ethSigUtil.signTypedDataLegacy(privKey, {
    data: getFormattedTypedDataReleaseTokensLegacy(sender, receiver, amount, nonce),
  })

export const signSessionID = (session: string, privKey: Buffer) =>
  ethSigUtil.signTypedDataLegacy(privKey, {
    data: [{type: 'string', name: 'Session', value: session}],
  })

export const recoverSessionIDSig = (session: string, signature: string) =>
  ethSigUtil.recoverTypedSignatureLegacy({
    data: [{type: 'string', name: 'Session', value: session}],
    sig: signature,
  })

export const generateSigNonce = () =>
  bufferToHex(soliditySha3({type: 'string', value: uuid()}))

export const getFormattedTypedDataReleaseTokensLegacy = (
  sender: string,
  receiver: string,
  amount: string,
  paymentNonce: string
): ITypedDataParam[] => {
  return [
    {type: 'string', name: 'action', value: 'pay'},
    {type: 'address', name: 'sender', value: sender},
    {type: 'address', name: 'receiver', value: receiver},
    {type: 'uint256', name: 'amount', value: amount},
    {type: 'bytes32', name: 'nonce', value: paymentNonce},
  ]
}
