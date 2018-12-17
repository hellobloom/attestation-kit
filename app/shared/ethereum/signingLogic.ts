const ethSigUtil = require('eth-sig-util')
import {HashingLogic} from '@bloomprotocol/attestations-lib'
import {IAttestParams} from '@shared/attestations/validateAttestParams'
import {toBuffer} from 'ethereumjs-util'

interface ITypedDataParam {
  type: string
  name: string
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
  contractAddress: string,
  dataHash: string,
  requestNonce: string,
  privKey: Buffer
) =>
  ethSigUtil.signTypedData(privKey, {
    data: HashingLogic.getAttestationAgreement(
      contractAddress,
      1,
      dataHash,
      requestNonce
    ),
  })

export const signAttestForDelegation = (
  contractAddress: string,
  attestParams: IAttestParams,
  privKey: Buffer
) =>
  ethSigUtil.signTypedData(privKey, {
    data: getFormattedTypedDataAttestFor(
      contractAddress,
      1,
      attestParams.subject,
      attestParams.requester,
      attestParams.reward.toString(10),
      attestParams.dataHash,
      attestParams.requestNonce
    ),
  })

export const signPaymentAuthorization = (
  contractAddress: string,
  sender: string,
  receiver: string,
  amount: string,
  nonce: string,
  privKey: Buffer
) =>
  ethSigUtil.signTypedData(privKey, {
    data: getFormattedTypedDataPayTokens(
      contractAddress,
      1,
      sender,
      receiver,
      amount,
      nonce
    ),
  })

export const signSessionID = (session: string, privKey: Buffer) =>
  HashingLogic.signHash(toBuffer(HashingLogic.hashMessage(session)), privKey)

export const recoverSessionIDSig = (session: string, signature: string) =>
  HashingLogic.recoverHashSigner(
    toBuffer(HashingLogic.hashMessage(session)),
    signature
  )

export const getFormattedTypedDataPayTokens = (
  contractAddress: string,
  chainId: number,
  sender: string,
  receiver: string,
  amount: string,
  paymentNonce: string
): IFormattedTypedData => {
  return {
    types: {
      EIP712Domain: [
        {name: 'name', type: 'string'},
        {name: 'version', type: 'string'},
        {name: 'chainId', type: 'uint256'},
        {name: 'verifyingContract', type: 'address'},
      ],
      PayTokens: [
        {name: 'sender', type: 'address'},
        {name: 'receiver', type: 'address'},
        {name: 'amount', type: 'uint256'},
        {name: 'nonce', type: 'bytes32'},
      ],
    },
    primaryType: 'PayTokens',
    domain: {
      name: 'Bloom Token Escrow Marketplace',
      version: '2',
      chainId: chainId,
      verifyingContract: contractAddress,
    },
    message: {
      sender: sender,
      receiver: receiver,
      amount: amount,
      nonce: paymentNonce,
    },
  }
}

export const getFormattedTypedDataAttestFor = (
  contractAddress: string,
  chainId: number,
  subject: string,
  requester: string,
  reward: string,
  dataHash: string,
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
        {name: 'dataHash', type: 'bytes32'},
        {name: 'requestNonce', type: 'bytes32'},
      ],
    },
    primaryType: 'AttestFor',
    domain: {
      name: 'Bloom Attestation Logic',
      version: '2',
      chainId: chainId,
      verifyingContract: contractAddress,
    },
    message: {
      subject: subject,
      requester: requester,
      reward: reward,
      dataHash: dataHash,
      requestNonce: requestNonce,
    },
  }
}
