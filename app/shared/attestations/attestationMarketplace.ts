import {env} from '@shared/environment'
import {
  loadTokenEscrowMarketplace,
  loadUnstableAccountRegistry,
} from '@shared/contracts/load'
import {serverLogger} from '@shared/logger'

import BigNumber from 'bignumber.js'
// import {GasPrice} from '@shared/models'
// import {serverLogger} from '@shared/logger'
//import * as marketplaceManager from '@shared/ethereum/account'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

const Marketplace = loadTokenEscrowMarketplace(env.tokenEscrowMarketplace.address) //.withProvider(marketplaceManager.web3.currentProvider)

const marketplace = Marketplace.withProvider(
  privateEngine(env.owner.ethPrivKey, {stage: 'testnet'})
)

const AccountRegistry = loadUnstableAccountRegistry(
  env.rinkebyAccountRegistryAddress
)
const accountRegistry = AccountRegistry.withProvider(
  privateEngine(env.owner.ethPrivKey, {stage: 'testnet'})
)

export const checkEscrowBalance = async (address: string): Promise<BigNumber> => {
  serverLogger.debug(`Checking escrow balance for address ${address}...`)
  const userId = await accountRegistry.accountIdForAddress.call(address)
  serverLogger.debug(`Checking escrow balance for id ${userId.toString(10)}...`)
  const balance = await marketplace.tokenEscrow.call(userId)
  serverLogger.debug('Checked escrow balance')
  return balance
}
