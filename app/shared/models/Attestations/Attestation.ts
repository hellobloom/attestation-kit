import * as Sequelize from 'sequelize-typescript'
import * as BigNumber from 'bignumber.js'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import {sequelize, Negotiation} from '@shared/models'
import {CognitoSMSStatus} from '@shared/attestations/CognitoSMSStatus'
import {EmailAttestationStatus} from '@shared/attestations/EmailAttestationStatus'
import {AttestationStatus, HashingLogic} from '@bloomprotocol/attestations-lib'

export interface IEmailAttestationJSONB {
  data: Array<HashingLogic.IAttestationData>
  verificationCode?: string
  verificationStatus?: EmailAttestationStatus
}

export interface IPhoneAttestationJSONB {
  data: Array<HashingLogic.IAttestationData>
  verificatiotatus?: CognitoSMSStatus
  cognitoProfile?: string
}

interface IAttestationResult {}

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
    type: Sequelize.DataType.INTEGER,
  })
  tx_id: number

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

  // IP todo remove this column
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

  @Sequelize.Column({
    type: Sequelize.DataType.NUMERIC(28, 18),
    allowNull: true,
  })
  get reward() {
    return new BigNumber.BigNumber(this.getDataValue('reward')).mul('1e18')
  }

  set reward(value: BigNumber.BigNumber) {
    this.setDataValue('reward', value.div('1e18').toString(10))
  }
}
