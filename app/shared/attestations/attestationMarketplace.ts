import {env} from '@shared/environment'
import {
  loadTokenEscrowMarketplace,
} from '@shared/contracts/load'
import {serverLogger} from '@shared/logger'

import BigNumber from 'bignumber.js'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

const Marketplace = loadTokenEscrowMarketplace(env.tokenEscrowMarketplace.address)

const marketplace = Marketplace.withProvider(
  privateEngine(env.owner.ethPrivKey, {stage: 'testnet'})
)

export const checkEscrowBalance = async (address: string): Promise<BigNumber> => {
  serverLogger.debug(`Checking escrow balance for address ${address}...`)
  const balance = await marketplace.tokenEscrow.call(address)
  serverLogger.debug('Checked escrow balance')
  return balance
}
