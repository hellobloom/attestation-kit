const ethSigUtil = require('eth-sig-util')
const {soliditySha3} = require('web3-utils')
import {AttestationTypeID} from 'attestations-lib'
import {IAttestationData} from '@shared/models/Attestation'
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
    data: getFormattedTypedDataAttestationRequestLegacy(
      subject,
      attester,
      requester,
      dataHash,
      typeIds,
      requestNonce
    ),
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

const serializeData = (data: object) => JSON.stringify(data)

const hashAttestationData = (input: IAttestationData) => {
  return soliditySha3({type: 'string', value: serializeData(input)})
}

const hashCombinedAttestationData = (input: object) => {
  return soliditySha3({type: 'string', value: serializeData(input)})
}

export const hashCompleteAttestationData = (input: IAttestationData[]) => {
  return hashCombinedAttestationData(input.map(data => hashAttestationData(data)))
}

export const hashTypeIds = (input: AttestationTypeID[]) => {
  return soliditySha3({type: 'uint256[]', value: input})
}

export const generateSigNonce = () =>
  bufferToHex(soliditySha3({type: 'string', value: uuid()}))

export const getFormattedTypedDataAttestationRequestLegacy = (
  subject: string,
  attester: string,
  requester: string,
  dataHash: string,
  typeIds: number[],
  requestNonce: string
): ITypedDataParam[] => {
  return [
    {type: 'address', name: 'subject', value: subject},
    {type: 'address', name: 'attester', value: attester},
    {type: 'address', name: 'requester', value: requester},
    {type: 'bytes32', name: 'dataHash', value: dataHash},
    {
      type: 'bytes32',
      name: 'typeHash',
      value: soliditySha3({type: 'uint256[]', value: typeIds}),
    },
    {type: 'bytes32', name: 'nonce', value: requestNonce},
  ]
}

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
