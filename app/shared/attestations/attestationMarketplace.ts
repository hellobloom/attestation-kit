import {env} from '@shared/environment'
import {loadTokenEscrowMarketplace} from '@shared/contracts/load'
import {log} from '@shared/logger'

import BigNumber from 'bignumber.js'
import {privateEngine} from '@shared/ethereum/customWeb3Provider'

let envPr = env()

let marketplacePr = envPr.then(e => {
  const Marketplace = loadTokenEscrowMarketplace(e.tokenEscrowMarketplace.address)
  return privateEngine(e.owner.ethPrivKey, {stage: 'testnet'}).then(pe => {
    const marketplace = Marketplace.withProvider(pe)
    return marketplace
  })
})

export const checkEscrowBalance = async (address: string): Promise<BigNumber> => {
  log(`Checking escrow balance for address ${address}...`, {level: 'debug'})
  const marketplace = await marketplacePr
  const balance = await marketplace.tokenEscrow.call(address)
  log('Checked escrow balance', {level: 'debug'})
  return balance
}
