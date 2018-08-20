import * as Sequelize from 'sequelize-typescript'

@Sequelize.Table({tableName: 'whisperFilters'})
export default class WhisperFilters extends Sequelize.Model<WhisperFilters> {
  @Sequelize.CreatedAt createdAt: Date

  @Sequelize.UpdatedAt updatedAt: Date

  @Sequelize.Column({
    type: Sequelize.DataType.STRING,
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
  })
  filterId: string

  @Sequelize.Column({
    allowNull: false,
    type: Sequelize.DataType.STRING,
  })
  entity: string

  @Sequelize.Column({
    type: Sequelize.DataType.STRING,
    allowNull: true,
  })
  keypairId: string

  @Sequelize.Column({
    type: Sequelize.DataType.BLOB,
    allowNull: false,
  })
  topic: Buffer
}
