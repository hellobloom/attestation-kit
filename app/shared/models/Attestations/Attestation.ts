import * as Sequelize from 'sequelize-typescript'
import * as BigNumber from 'bignumber.js'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {sequelize, Negotiation, NegotiationMsg} from '@shared/models'
import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {EmailAttestationStatus} from '@shared/attestations/EmailAttestationStatus'
import {AttestationStatus, HashingLogic} from '@bloomprotocol/attestations-lib'
import {PersistDataTypes} from '@shared/attestations/whisperPersistDataHandler'
import {
  TValidateJobDetailsOutput,
  validateJobDetails,
  IJobDetails,
} from '@shared/attestations/validateJobDetails'
import {
  validateAttestParams,
  TValidateAttestParamsOutput,
  IUnvalidatedAttestParams,
} from '@shared/attestations/validateAttestParams'

export interface IEmailAttestationJSONB {
  data: Array<HashingLogic.IAttestationData>
  verificationCode?: string
  verificationStatus?: EmailAttestationStatus
}

export interface IPhoneAttestationJSONB {
  data: Array<HashingLogic.IAttestationData>
  verificationCode?: string
  verificationStatus?: CognitoSMSStatus
  cognitoProfile?: string
}

export interface IAttestationResult {
  attestationId: number
  decision?: number
  certainty?: number
}

export type AttestationRole = 'attester' | 'requester'

export type IAttestationDataJSONB = IEmailAttestationJSONB | IPhoneAttestationJSONB

export const AttestationStatusDataType = Sequelize.DataType.ENUM(
  Object.keys(AttestationStatus)
)

@Sequelize.Table({tableName: 'attestations'})
export default class Attestation extends Sequelize.Model<Attestation> {
  @Sequelize.Column({
    primaryKey: true,
    allowNull: false,
    unique: true,
    type: Sequelize.DataType.UUID,
    defaultValue: Sequelize.DataType.UUIDV4,
  })
  id: string

  @Sequelize.CreatedAt createdAt: Date
  @Sequelize.UpdatedAt updatedAt: Date

  @Sequelize.Column({
    allowNull: true,
    type: Sequelize.DataType.ARRAY(Sequelize.DataType.INTEGER),
  })
  types: number[]

  @Sequelize.Column({
    allowNull: true,
    type: Sequelize.DataType.STRING,
  })
  type: string

  @Sequelize.Column({
    type: AttestationStatusDataType,
    allowNull: false,
    defaultValue: AttestationStatus.initial,
  })
  status: AttestationStatus

  @Sequelize.Column({type: Sequelize.DataType.BLOB})
  attester: Buffer
  @Sequelize.Column({type: Sequelize.DataType.BLOB})
  requester: Buffer
  @Sequelize.Column({type: Sequelize.DataType.BLOB})
  subject: Buffer
  @Sequelize.Column({type: Sequelize.DataType.STRING})
  role: AttestationRole

  @Sequelize.Column({type: Sequelize.DataType.JSONB})
  get data() {
    return this.getDataValue('data')
  }
  set data(value: IAttestationDataJSONB) {
    this.setDataValue('data', value)
  }

  @Sequelize.Column({type: Sequelize.DataType.JSONB})
  get result() {
    return this.getDataValue('result')
  }
  set result(value: IAttestationResult) {
    this.setDataValue('result', value)
  }

  @Sequelize.Column({type: Sequelize.DataType.BLOB})
  subjectSig: Buffer

  @Sequelize.Column({
    type: Sequelize.DataType.BLOB,
  })
  get requestNonce() {
    return bufferToHex(this.getDataValue('requestNonce'))
  }
  set requestNonce(value: string) {
    this.setDataValue('requestNonce', toBuffer(value))
  }

  @Sequelize.Column({
    type: Sequelize.DataType.BLOB,
    allowNull: true,
  })
  get paymentNonce() {
    return bufferToHex(this.getDataValue('paymentNonce'))
  }
  set paymentNonce(value: string) {
    this.setDataValue('paymentNonce', toBuffer(value))
  }

  @Sequelize.Column({type: Sequelize.DataType.BLOB})
  paymentSig: Buffer

  @Sequelize.Column({allowNull: true, type: Sequelize.DataType.UUID})
  negotiationId: string

  @Sequelize.BelongsTo(() => Negotiation, {
    foreignKey: 'negotiationId',
  })
  Negotiation?: Negotiation

  @Sequelize.Column({allowNull: true, type: Sequelize.DataType.BLOB})
  get attestTx() {
    return bufferToHex(this.getDataValue('attestTx'))
  }
  set attestTx(value: string) {
    this.setDataValue('attestTx', toBuffer(value))
  }

  /**
   * Given (negotiationId), returns an Attestation model
   * @param negotiationId Foreign key referencing Negotiations
   */

  lockForTransaction = (transaction: any) => {
    return sequelize.query(
      'select * from "attestations" where id = ? for update nowait',
      {
        transaction: transaction,
        replacements: [this.id],
      }
    )
  }

  validateJobDetailsView(): IJobDetails {
    return {
      // Making sure the data prop only contains what the validate job details cares about
      data: {
        // Making sure the order of properties matches client side
        data: this.data.data.map((d: HashingLogic.IAttestationData) => {
          return {
            type: d.type,
            provider: d.provider,
            data: d.data,
            nonce: d.nonce,
            version: d.version,
          }
        }),
      },
      requestNonce: this.requestNonce,
      types: this.types,
      subject: bufferToHex(this.subject),
      subjectSig: bufferToHex(this.subjectSig),
      attester: bufferToHex(this.attester),
      requester: bufferToHex(this.requester),
    }
  }

  /**
   * Given (negotiationId), returns an Attestation model
   * @param negotiationId Foreign key referencing Negotiations
   */
  static async findAndValidateJobDetails(
    negotiationId: string,
    role?: string
  ): Promise<TValidateJobDetailsOutput> {
    const where: any = {
      negotiationId: negotiationId,
    }
    if (role) {
      where.role = role
    }
    const attestation = await this.findOne({where})
    if (attestation === null) {
      return {kind: 'invalid_param', message: 'attestation null'}
    }
    const jobDetails = attestation.validateJobDetailsView()
    return validateJobDetails(jobDetails)
  }

  async reward(): Promise<BigNumber.BigNumber> {
    const negotiationId = this.negotiationId
    const bid = await NegotiationMsg.findOne({
      where: {
        negotiationId: negotiationId,
        messageType: PersistDataTypes.storeAttestationBid,
      },
    })
    if (bid === null) {
      throw new Error(`No bid found for ${negotiationId}`)
    }
    return bid.bid
  }

  attestParamsView = async (): Promise<IUnvalidatedAttestParams> => {
    return {
      subject: bufferToHex(this.subject),
      attester: bufferToHex(this.attester),
      requester: bufferToHex(this.requester),
      reward: await this.reward(),
      paymentNonce: this.paymentNonce,
      requesterSig: bufferToHex(this.paymentSig),
      data: {
        // Making sure the order of properties matches client side
        data: this.data.data.map((d: HashingLogic.IAttestationData) => {
          return {
            type: d.type,
            provider: d.provider,
            data: d.data,
            nonce: d.nonce,
            version: d.version,
          }
        }),
      },
      types: this.types,
      requestNonce: this.requestNonce,
      subjectSig: bufferToHex(this.subjectSig),
    }
  }

  /**
   * Given (negotiationId), returns an Attestation model
   * @param negotiationId Foreign key referencing Negotiations
   */
  async findAndValidateAttestParams(
    negotiationId: string
  ): Promise<TValidateAttestParamsOutput> {
    const attestParams = await this.attestParamsView()
    return validateAttestParams(attestParams)
  }
}
