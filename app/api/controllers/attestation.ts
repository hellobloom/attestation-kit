import * as m from '@shared/models'
import {log} from '@shared/logger'
import {boss} from '@shared/jobs/boss'
import * as dc from 'deepcopy'
import * as express from 'express'
import {
  AttestationTypeNames,
  HashingLogic,
  Validation,
  AttestationStatus,
} from '@bloomprotocol/attestations-lib'
import {validateDateTime} from '@bloomprotocol/attestations-lib/src/RFC3339DateTime'
import {env, getContractAddr, getJobConfig} from '@shared/environment'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {Attestation} from '@shared/models'
import {
  IAttestParams,
  validateAttestParams,
} from '@shared/attestations/validateAttestParams'

let envPr = env()

// list all attestations
export const show = (req: any, res: any) => {
  const where = req.body.where ? dc(req.body.where) : {}
  where.role = 'attester'

  let perPage = req.body.per_page ? parseInt(req.body.per_page, 10) : 100
  let offset = req.body.page ? perPage * parseInt(req.body.page, 10) : 0

  m.Attestation.findAll({
    where: where,
    limit: perPage,
    offset: offset,
  }).then(r => {
    res.json({success: true, attestations: r})
  })
}

// perform attestation on an existing request
export const perform = async (req: any, res: any) => {
  const attestation = await m.Attestation.findById(req.body.attestation_id)
  if (attestation) {
    log('Received request to perform attestation...')
    attestation.update({
      result: {
        attestationId: attestation.id,
      },
    })
    // tie in - perform attestation
    const bossInstance = await boss
    bossInstance.publish(
      'submit-attestation',
      {
        negotiationId: req.body.negotiation_id || attestation.negotiationId,
        attestationId: attestation.id,
        gasPrice: req.body.gas_price,
      },
      await getJobConfig('submitAttestation')
    )
    //
    res.json({success: true, attestation})
  } else {
    res.status(404).json({success: false, message: 'Not found'})
  }
}

let claimNodeTests = {
  defined: (claimNode: any) => typeof claimNode !== 'undefined',
  dataDefined: (claimNode: any) => typeof claimNode.data !== 'undefined',
  dataDataDefined: (claimNode: any) => typeof claimNode.data.data === 'string',
  dataNonceDefined: (claimNode: any) => typeof claimNode.data.nonce === 'string',
  dataVersionDefined: (claimNode: any) => typeof claimNode.data.version === 'string',
  typeDefined: (claimNode: any) => typeof claimNode.type !== 'undefined',
  validType: (claimNode: any) =>
    AttestationTypeNames.indexOf(claimNode.type.type) > -1,
  typeNonceDefined: (claimNode: any) => typeof claimNode.type.nonce === 'string',
  auxDefined: (claimNode: any) => typeof claimNode.aux === 'string',
}

export const receiveSubjectDataLegacy: express.RequestHandler = async (req, res) => {
  let e = await envPr
  if (!Array.isArray(req.body.dataNodes) || !req.body.dataNodes.length) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain a non-empty dataNodes array.',
    })
  }

  let errors: Array<{error: string; index: number; testFailed?: boolean}> = []

  let nodes = req.body.dataNodes as Array<any>
  nodes.forEach((dataNode: any, i) => {
    Object.keys(claimNodeTests).forEach(k => {
      let test = claimNodeTests[k]
      try {
        let testResult = test(dataNode)
        if (!testResult) {
          errors.push({error: k, index: i})
        }
      } catch (err) {
        errors.push({error: k, index: i, testFailed: true})
      }
    })
  })

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        'Each data node in the dataNodes field must contain a properly structured IAttestation.',
      errors: errors,
    })
  }

  const dataNodes: HashingLogic.IAttestationLegacy[] = req.body.dataNodes
  const attesterPrivateKey = toBuffer(e.owner.key)
  const merkleTreeComponents = HashingLogic.getSignedMerkleTreeComponentsLegacy(
    dataNodes,
    attesterPrivateKey
  )
  log(
    `[receiveSubjectData] merkleTreeComponents: ${JSON.stringify(
      merkleTreeComponents
    )}`
  )

  return res.status(200).json({merkleTreeComponents})
}

export const receiveSubjectData: express.RequestHandler = async (req, res) => {
  let e = await envPr
  if (!Array.isArray(req.body.dataNodes) || !req.body.dataNodes.length) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain a non-empty dataNodes array.',
    })
  }
  if (
    typeof req.body.issuanceDate !== 'string' ||
    typeof req.body.expirationDate !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain issuanceDate and expirationDate.',
    })
  }

  let errors: Array<{error: string; index: number; testFailed?: boolean}> = []

  let nodes = req.body.claimNodes as Array<any>
  nodes.forEach((dataNode: any, i) => {
    Object.keys(claimNodeTests).forEach(k => {
      let test = claimNodeTests[k]
      try {
        let testResult = test(dataNode)
        if (!testResult) {
          errors.push({error: k, index: i})
        }
      } catch (err) {
        errors.push({error: k, index: i, testFailed: true})
      }
    })
  })

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        'Each data node in the dataNodes field must contain a properly structured IAttestation.',
      errors: errors,
    })
  }

  let issuanceDate: string
  let expirationDate: string

  if (
    validateDateTime(req.body.issuanceDate) &&
    validateDateTime(req.body.expirationDate)
  ) {
    issuanceDate = req.body.issuanceDate
    expirationDate = req.body.expirationDate
  } else {
    return res.status(400).json({
      success: false,
      message: `Issuance and expiration date must be valid RFC3339 timestamp`,
    })
  }

  const dataNodes: HashingLogic.IClaimNode[] = req.body.dataNodes
  const attesterPrivateKey = toBuffer(e.owner.key)
  try {
    const merkleTreeComponents = HashingLogic.getSignedMerkleTreeComponents(
      dataNodes,
      issuanceDate,
      expirationDate,
      attesterPrivateKey
    )
    log(
      `[receiveSubjectData] merkleTreeComponents: ${JSON.stringify(
        merkleTreeComponents
      )}`
    )

    const outcome = Validation.validateBloomMerkleTreeComponents(
      merkleTreeComponents
    )
    if (outcome.kind === 'invalid_param') {
      throw new Error(`Validation failed on merkle tree: ${outcome.message}`)
    }
    return res.status(200).json(outcome.data)
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Failed to construct merkle tree',
      error: err,
    })
  }
}

export const receiveSignedAgreementLegacy: express.RequestHandler = async (
  req,
  res
) => {
  if (
    typeof req.body.negotiationId !== 'string' ||
    typeof req.body.subject !== 'string' ||
    typeof req.body.requester !== 'string' ||
    typeof req.body.attester !== 'string' ||
    typeof req.body.dataHash !== 'string' ||
    typeof req.body.nonce !== 'string' ||
    typeof req.body.signature !== 'string' ||
    typeof req.body.gasPrice !== 'string' ||
    typeof req.body.network !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Request body must contain the fields of an attestation agreement,' +
        ' an negotiationId, a signature, and a gasPrice.',
    })
  }
  const attestation = await Attestation.findOne({
    where: {
      negotiationId: req.body.negotiationId,
      role: 'attester',
      status: AttestationStatus.ready,
    },
  })

  if (!attestation) {
    return res.status(400).json({
      success: false,
      message: `Attestation not found for negotiation id ${req.body.negotiationId}`,
    })
  }

  const attestParams: IAttestParams = {
    attestationId: attestation.id,
    subject: req.body.subject,
    attester: req.body.attester,
    requester: req.body.requester,
    reward: attestation.reward,
    requesterSig: bufferToHex(attestation.paymentSig),
    dataHash: req.body.dataHash,
    requestNonce: req.body.nonce,
    subjectSig: req.body.signature,
    attestationLogicAddress: await getContractAddr('AttestationLogic'),
    tokenEscrowMarketplaceAddress: await getContractAddr('TokenEscrowMarketplace'),
  }

  const validationResult = await validateAttestParams(attestParams)
  if (validationResult.kind === 'validated') {
    // Call attestation logic `attest` and webhook bloom-web with tx and more
    const bossInstance = await boss
    Object.assign(attestParams, {
      gasPrice: req.body.gasPrice,
      network: req.body.network,
    })
    bossInstance.publish(
      'submit-attestation',
      attestParams,
      await getJobConfig('submitAttestation')
    )

    log(
      {
        name: 'AttestationEvent',
        event: {
          Action: 'EnqueueAttest',
          AttestationId: attestParams.attestationId,
        },
      },
      {event: true}
    )

    return res.status(200).json({success: true})
  } else {
    return res.status(400).json({
      success: false,
      message: validationResult.message,
    })
  }
}

export const receiveSignedAgreement: express.RequestHandler = async (req, res) => {
  let e = await envPr
  if (
    typeof req.body.contractAddress !== 'string' ||
    typeof req.body.subject !== 'string' ||
    typeof req.body.subjectSig !== 'string' ||
    typeof req.body.components !== 'object'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain contract address, subject and subjectSig',
    })
  }
  const componentOutcome = Validation.validateBloomMerkleTreeComponents(
    req.body.components
  )
  if (componentOutcome.kind === 'invalid_param') {
    return res.status(400).json({
      success: false,
      message: `Components failed validation ${componentOutcome.message}`,
    })
  }

  const attesterPrivateKey = toBuffer(e.owner.key)

  try {
    const batchComponents = HashingLogic.getSignedBatchMerkleTreeComponents(
      req.body.components,
      req.body.contractAddress,
      req.body.subjectSig,
      req.body.subject,
      req.body.requestNonce,
      attesterPrivateKey
    )
    const outcome = Validation.validateBloomBatchMerkleTreeComponents(
      batchComponents
    )
    if (outcome.kind === 'invalid_param') {
      throw new Error(`Validation failed on batch merkle tree: ${outcome.message}`)
    }
    return res.status(200).json(outcome.data)
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Failed to construct batch merkle tree',
      error: err,
    })
  }
}
