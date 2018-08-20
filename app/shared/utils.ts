import {differenceInSeconds} from 'date-fns'
import {isString} from 'lodash'
import * as EthU from 'ethereumjs-util'
import * as wallet from 'ethereumjs-wallet'
import {isNumber} from 'util'

export const trimEmailInData = (data: {email?: any}): {email?: any} => {
  if (typeof data.email === 'string') {
    return {...data, email: data.email.trim()}
  }
  return data
}

export const isValidHttpDate = (date: string) =>
  new Date(date).toUTCString() === date

const ALLOWED_SIGNATURE_DATE_DRIFT = 3600 // 60 minutes

/**
 * Validate whether the date string is within the permitted drift for our
 * timing requirements.
 *
 * Used in validating HTTP request signatures.
 *
 * @param httpDate RFC-1123 UTC date string
 */
export const isRecentDate = (httpDate: string) => {
  const date = new Date(httpDate)
  const now = new Date()
  const difference = Math.abs(differenceInSeconds(date, now))

  return difference < ALLOWED_SIGNATURE_DATE_DRIFT
}

const emailPattern = /^[^@\s;,]+@[^@\s;,]+\.[^@\s;,]+$/

export const isValidEmail = (email: string): boolean =>
  isString(email) && emailPattern.test(email)

const isNotEmpty = (value: string) => value.replace(/\s+/g, '') !== ''
export const isNotEmptyString = (value: any) => isString(value) && isNotEmpty(value)

export const isValidTimestamp = (value: any) =>
  isNumber(value) && value >= 0 && value <= new Date().getTime()

// TODO: libphonenumber
export const isValidPhoneNumber = (value: string) =>
  value.replace(/[^\d]/g, '').length >= 8

export const privateKeyToAddress = (privateKey: string) =>
  wallet.fromPrivateKey(EthU.toBuffer(privateKey)).getAddressString()

/**
 * Check whether a signup signature was created by the given ETH address
 *
 * @param rpcSig a user provided RPC signature string (like "0x010203")
 * @param ethAddress the string ETH address that claims to have signed the string
 */
export function signupSignatureMatches(rpcSig: string, ethAddress: string) {
  const recoveredSigner: Buffer = recoverEthAddressFromPersonalRpcSig(
    'Hello, Bloom!',
    rpcSig
  )
  return recoveredSigner.equals(EthU.toBuffer(ethAddress))
}

export function recoverEthAddressFromDigest(digest: Buffer, rpcSig: string): Buffer {
  // Extract the signature parts so we can recover the public key
  const sigParts = EthU.fromRpcSig(rpcSig)
  // Recover public key from the hash of the message we constructed and the signature the user provided
  const recoveredPubkey = EthU.ecrecover(digest, sigParts.v, sigParts.r, sigParts.s)
  // Convert the recovered public key into the corresponding ethereum address
  const recoveredAddress = wallet
    .fromPublicKey(new Buffer(recoveredPubkey, 'hex'))
    .getAddressString()

  return new Buffer(EthU.stripHexPrefix(recoveredAddress), 'hex')
}

/**
 * Recover an Ethereum address string from an RPC signature.
 *
 * The data types involved here are important to understand because recovery and signature
 * can mean many things:
 *
 * - An RPC signature is a string still of the format "0x123456...". This is what web3 produces
 *   while most libraries expect a hash contains values `v`, `r`, and `s`
 *
 * - The signed text here should be the actual ASCII text that the end user would see. If they
 *   signed the text "Hello, Bloom!" then you should pass that in here. Other libraries will need
 *   you to call `sha3` on the input before recovering or add a prefix to the string before calling
 *   the function.
 *
 * - This function returns a `Buffer` of the Ethereum address. The `ecrecover` function shipped with
 *   ethereumjs-util returns the *public key* which is different.
 *
 * - This function recovers signatures that were produced with `web3.personal.sign` which is *different*
 *   from `web3.eth.sign`. The `personal.sign` function is for ascii text the user sees. The `eth.sign`
 *   is for signing raw transaction data.
 *
 * @param signedText a string like "Hello, Bloom!" that the user signed in order to produce `rpcSig`
 * @param rpcSig a user provided RPC signature string (like "0x123456") produced from the `signedText`
 * @return The ETH address used to sign the text
 */
export function recoverEthAddressFromPersonalRpcSig(
  signedText: string,
  rpcSig: string
): Buffer {
  // Hash the text the same way web3 does with the weird "Ethereum Signed Message" text
  const hashed = EthU.hashPersonalMessage(EthU.toBuffer(signedText))

  return recoverEthAddressFromDigest(hashed, rpcSig)
}

/**
 * Validate a hex encoded signature string
 *
 * @param signatureString A signature string like "0x123456..."
 */
export const isValidSignatureString = (signatureString: string): boolean => {
  let signature: EthU.Signature
  try {
    signature = EthU.fromRpcSig(signatureString)
  } catch {
    return false
  }
  const {v, r, s} = signature
  return EthU.isValidSignature(v, r, s, true)
}
