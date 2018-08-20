import * as Web3 from 'web3'
import * as BigNumber from 'bignumber.js'
import * as Sequelize from 'sequelize-typescript'

@Sequelize.Table({tableName: 'gasPrices'})
export default class GasPrice extends Sequelize.Model<GasPrice> {
  @Sequelize.Column({
    allowNull: false,
    primaryKey: true,
    unique: true,
  })
  blockNumber: number

  @Sequelize.CreatedAt createdAt: Date
  @Sequelize.UpdatedAt updatedAt: Date

  static async latest() {
    const latestGasPrice = await this.findOne({order: [['blockNumber', 'DESC']]})
    if (!latestGasPrice) throw new Error('No gas prices found!')

    return latestGasPrice
  }

  static async deleteOldPrices() {
    await this.sequelize.query(
      `DELETE FROM "gasPrices" 
        WHERE "blockNumber" NOT IN (SELECT "blockNumber" FROM "gasPrices" ORDER BY "updatedAt" DESC LIMIT 500)`
    )
  }

  @Sequelize.Column({allowNull: false, type: Sequelize.DataType.FLOAT})
  get safeLow(): BigNumber.BigNumber {
    return this.getBignumColumn('safeLow')
  }

  set safeLow(value: BigNumber.BigNumber) {
    this.setBignumColumn('safeLow', value)
  }

  @Sequelize.Column({allowNull: false, type: Sequelize.DataType.FLOAT})
  get average(): BigNumber.BigNumber {
    return this.getBignumColumn('average')
  }

  set average(value: BigNumber.BigNumber) {
    this.setBignumColumn('average', value)
  }

  @Sequelize.Column({allowNull: false, type: Sequelize.DataType.FLOAT})
  get fastest(): BigNumber.BigNumber {
    return this.getBignumColumn('fastest')
  }

  set fastest(value: BigNumber.BigNumber) {
    this.setBignumColumn('fastest', value)
  }

  private getBignumColumn(name: string): BigNumber.BigNumber {
    return new BigNumber.BigNumber(
      Web3.prototype.toWei(this.getDataValue(name), 'gwei')
    )
  }

  private setBignumColumn(name: string, value: BigNumber.BigNumber) {
    this.setDataValue(name, value.div(Web3.prototype.toWei(1, 'gwei')).toNumber())
  }
}
