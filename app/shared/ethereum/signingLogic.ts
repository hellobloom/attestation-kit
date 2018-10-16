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

interface IFormattedTypedData {
  types: {
    EIP712Domain: ITypedDataParam[]
    [key: string]: ITypedDataParam[]
  }
  primaryType: string
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  }
  message: {[key: string]: string}
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

export const getFormattedTypedDataAttestFor = (
  subject: string,
  requester: string,
  reward: string,
  paymentNonce: string,
  dataHash: string,
  typeIds: number[],
  requestNonce: string
): IFormattedTypedData => {
  return {
    types: {
      EIP712Domain: [
        {name: 'name', type: 'string'},
        {name: 'version', type: 'string'},
        {name: 'chainId', type: 'uint256'},
        {name: 'verifyingContract', type: 'address'},
      ],
      AttestFor: [
        {name: 'subject', type: 'address'},
        {name: 'requester', type: 'address'},
        {name: 'reward', type: 'uint256'},
        {name: 'paymentNonce', type: 'bytes32'},
        {name: 'dataHash', type: 'bytes32'},
        {name: 'typeHash', type: 'bytes32'},
        {name: 'requestNonce', type: 'bytes32'},
      ],
    },
    primaryType: 'AttestFor',
    domain: {
      name: 'Bloom',
      version: '1',
      // Rinkeby
      chainId: 4,
      // Dummy contract address for testing
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
      subject: subject,
      requester: requester,
      reward: reward,
      paymentNonce: paymentNonce,
      dataHash: dataHash,
      typeHash: soliditySha3({type: 'uint256[]', value: typeIds}),
      requestNonce: requestNonce,
    },
  }
}
