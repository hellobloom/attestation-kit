import * as Sequelize from 'sequelize-typescript'
import {Negotiation} from '@shared/models'
import * as BigNumber from 'bignumber.js'

import * as S from 'sequelize-typescript'

enum WhisperMsgType {
  solicitation = 'solicitation',
  attestationBid = 'attestationBid',
  bidAcceptance = 'bidAcceptance',
  attestationRequest = 'attestationRequest',
  jobFulfilled = 'jobFulfilled',
  personalInformation = 'personalInformation',
}

export const WhisperMsgDataType = S.DataType.ENUM(Object.keys(WhisperMsgType))

@Sequelize.Table({tableName: 'negotiationMsgs'})
export default class NegotiationMsg extends Sequelize.Model<NegotiationMsg> {
  @Sequelize.CreatedAt createdAt: Date

  @Sequelize.UpdatedAt updatedAt: Date

  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    primaryKey: true,
    allowNull: false,
    unique: true,
    defaultValue: Sequelize.DataType.UUIDV4,
  })
  uuid: string

  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    allowNull: true,
  })
  regardingUuid: string

  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    allowNull: false,
  })
  negotiationId: string

  @Sequelize.BelongsTo(() => Negotiation, {
    foreignKey: 'negotiationId',
  })
  Negotiation?: Negotiation

  @Sequelize.Column({
    type: Sequelize.DataType.BLOB,
    allowNull: true,
  })
  futureTopic: Buffer

  @Sequelize.Column({
    type: WhisperMsgDataType,
    allowNull: false,
  })
  messageType: string

  @Sequelize.Column({
    type: Sequelize.DataType.NUMERIC(28, 18),
    allowNull: true, // defaults to 'unknown'
  })
  get bid() {
    return new BigNumber.BigNumber(this.getDataValue('bid')).mul('1e18')
  }

  set bid(value: BigNumber.BigNumber) {
    this.setDataValue('bid', value.div('1e18').toString(10))
  }

  @Sequelize.Column({
    type: Sequelize.DataType.STRING,
    allowNull: true,
  })
  replyTo: string
}
