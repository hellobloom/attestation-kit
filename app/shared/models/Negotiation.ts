import * as Sequelize from 'sequelize-typescript'
import {NegotiationMsg, Attestation} from '@shared/models'
import * as BigNumber from 'bignumber.js'
import {bufferToHex} from 'ethereumjs-util'

@Sequelize.Table({tableName: 'negotiations'})
export default class Negotiation extends Sequelize.Model<Negotiation> {
  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
  })
  id: string

  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
  })
  attestationId: string

  @Sequelize.BelongsTo(() => Attestation, {
    foreignKey: 'attestationId',
  })
  Attestation?: Attestation

  @Sequelize.HasMany(() => NegotiationMsg, {
    foreignKey: 'negotiationId',
  })
  NegotiationMsgs: NegotiationMsg[]

  @Sequelize.Column({
    type: Sequelize.DataType.BLOB,
    allowNull: false,
  })
  attestationTopic: Buffer

  @Sequelize.CreatedAt createdAt: Date

  @Sequelize.UpdatedAt updatedAt: Date

  @Sequelize.Column({
    type: Sequelize.DataType.NUMERIC(28, 18),
    allowNull: false, // defaults to 'unknown'
  })
  get initialReward() {
    return new BigNumber.BigNumber(this.getDataValue('initialReward')).mul('1e18')
  }

  set initialReward(value: BigNumber.BigNumber) {
    this.setDataValue('initialReward', value.div('1e18').toString(10))
  }

  async getAttestationTopic() {
    return bufferToHex(this.attestationTopic)
  }
}
