const uuid = require('uuidv4')
import * as Wallet from 'ethereumjs-wallet'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {
  validateJobDetails,
  IJobDetails,
} from '@shared/attestations/validateJobDetails'
import {signAttestationRequest} from '@shared/ethereum/signingLogic'
import {HashingLogic} from '@bloomprotocol/attestations-lib'

beforeEach(() => {
  jest.clearAllMocks()
})

const subjectPrivKey =
  '0xf90c991bd33e54abe929463e24c0d315abcf03a5ef1e628d587615371af8dff3'
const attesterPrivKey =
  '0x0c88a947db95fcf2ebadfcda78d07f29b049508ca114b45b24269c7c5b443923'
const requesterPrivKey =
  '0x96f3f9dfb9abc8e597669d9b7f9abe4c9b04b44fd7c897adbc95dad4060a4c06'

const subjectWallet: Wallet.Wallet = Wallet.fromPrivateKey(toBuffer(subjectPrivKey))
const subjectAddress = subjectWallet.getAddressString()
const attesterWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(attesterPrivKey)
)
const attesterAddress = attesterWallet.getAddressString()
const requesterWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(requesterPrivKey)
)
const requesterAddress = requesterWallet.getAddressString()

const phoneNonce = uuid()
const emailNonce = uuid()
const requestNonce = uuid()

const phoneData: HashingLogic.IAttestationData = {
  type: 'phone',
  provider: 'Bloom',
  data: '12223334444',
  nonce: phoneNonce,
  version: '1.0.0',
}

const emailData: HashingLogic.IAttestationData = {
  type: 'email',
  provider: 'Bloom',
  data: 'abc@google.com',
  nonce: emailNonce,
  version: '1.0.0',
}

const hashedData = bufferToHex(
  HashingLogic.getMerkleTree([phoneData, emailData]).getRoot()
)

const subjectSig = signAttestationRequest(
  subjectAddress,
  attesterAddress,
  requesterAddress,
  hashedData,
  [0, 1],
  requestNonce,
  toBuffer(subjectPrivKey)
)

const unrelatedSig = signAttestationRequest(
  subjectAddress,
  attesterAddress,
  requesterAddress,
  hashedData,
  [0, 1],
  requestNonce,
  toBuffer(attesterPrivKey)
)

const validJobDetails: IJobDetails = {
  data: {data: [phoneData, emailData]},
  requestNonce: requestNonce,
  types: [0, 1],
  subject: subjectAddress,
  subjectSig: subjectSig,
  attester: attesterAddress,
  requester: requesterAddress,
}

describe('Validating Job Details', () => {
  it('returns validated parameters', async () => {
    const validated = await validateJobDetails(validJobDetails)
    expect(validated).toHaveProperty('kind', 'validated')
    expect(validated).toHaveProperty('data')
    if (validated.kind === 'validated') {
      expect(validated.data).toEqual(validJobDetails)
    }
  })

  it('returns invalid if subjectSig signed by different user', async () => {
    const validated = await validateJobDetails({
      data: {data: [phoneData, emailData]},
      requestNonce: requestNonce,
      types: [0, 1],
      subject: subjectAddress,
      subjectSig: unrelatedSig,
      attester: attesterAddress,
      requester: requesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })

  it('returns invalid if request nonce does not match sig', async () => {
    const validated = await validateJobDetails({
      data: {data: [phoneData, emailData]},
      requestNonce: uuid(),
      types: [0, 1],
      subject: subjectAddress,
      subjectSig: subjectSig,
      attester: attesterAddress,
      requester: requesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })

  it('returns invalid if data does not match sig', async () => {
    const validated = await validateJobDetails({
      data: {data: [emailData]},
      requestNonce: requestNonce,
      types: [0, 1],
      subject: subjectAddress,
      subjectSig: subjectSig,
      attester: attesterAddress,
      requester: requesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })

  it('returns invalid if type does not match sig', async () => {
    const validated = await validateJobDetails({
      data: {data: [phoneData, emailData]},
      requestNonce: requestNonce,
      types: [0, 1, 2],
      subject: subjectAddress,
      subjectSig: subjectSig,
      attester: attesterAddress,
      requester: requesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })

  it('returns invalid if attester does not match sig', async () => {
    const validated = await validateJobDetails({
      data: {data: [phoneData, emailData]},
      requestNonce: requestNonce,
      types: [0, 1],
      subject: subjectAddress,
      subjectSig: subjectSig,
      attester: subjectAddress,
      requester: requesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })

  it('returns invalid if requester does not match sig', async () => {
    const validated = await validateJobDetails({
      data: {data: [phoneData, emailData]},
      requestNonce: requestNonce,
      types: [0, 1],
      subject: subjectAddress,
      subjectSig: subjectSig,
      attester: attesterAddress,
      requester: attesterAddress,
    })
    expect(validated).toHaveProperty('kind', 'invalid_param')
    expect(validated).toHaveProperty('message', 'Invalid subjectSig')
  })
})
