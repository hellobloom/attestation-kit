import * as S from 'sequelize-typescript'

@S.Table({tableName: 'whisper_pings'})
export default class Ping extends S.Model<Ping> {
  @S.Column({
    allowNull: false,
    primaryKey: true,
    unique: true,
  })
  @S.CreatedAt
  created: Date

  @S.UpdatedAt updated: Date

  @S.Column({type: S.DataType.BLOB})
  responder: Buffer
}
