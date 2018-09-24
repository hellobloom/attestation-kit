import * as Sequelize from 'sequelize-typescript'
import {Attestation} from '@shared/models'
import {WhisperMsgDataType} from '@shared/models/NegotiationMsg'
import {bufferToHex, sha256} from 'ethereumjs-util'

@Sequelize.Table({tableName: 'attestation_data'})
export default class AttestationData extends Sequelize.Model<AttestationData> {
  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
  })
  id: string

  @Sequelize.CreatedAt created: Date

  @Sequelize.UpdatedAt updated: Date

  @Sequelize.Column({
    type: Sequelize.DataType.UUID,
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
  })
  attestationId: string

  @Sequelize.BelongsTo(() => Attestation, {
    foreignKey: 'attestationId',
  })
  Attestation?: Attestation

  // Column to specify data storage type
  @Sequelize.Column({
    allowNull: false,
    type: WhisperMsgDataType,
  })
  messageType: string

  // Column to specify data storage type
  @Sequelize.Column({
    allowNull: false,
    type: Sequelize.DataType.STRING,
  })
  datatype: 'text' | 'blob'

  // Column for data stored as text
  @Sequelize.Column({
    allowNull: false,
    type: Sequelize.DataType.TEXT,
  })
  dtext: string

  // Column for data stored as blob
  @Sequelize.Column({
    allowNull: false,
    type: Sequelize.DataType.BLOB,
  })
  dblob: Buffer

  // Cryptographic challenge (SHA256'ed password)
  @Sequelize.Column({
    allowNull: false,
    type: Sequelize.DataType.STRING,
  })
  challenge: string

  testChallenge = (passphrase: string) => {
    let passphraseHash = bufferToHex(sha256(passphrase))
    return passphrase && this.challenge && passphraseHash === this.challenge
  }
}
