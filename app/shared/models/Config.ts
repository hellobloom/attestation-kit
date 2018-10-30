import * as S from 'sequelize-typescript'

@S.Table({tableName: 'config'})
export default class Config extends S.Model<Config> {
  @S.Column({
    allowNull: false,
    primaryKey: true,
    unique: true,
    type: S.DataType.STRING,
  })
  key: string

  @S.Column({type: S.DataType.JSONB})
  value: any
}
