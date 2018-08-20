import * as Web3 from 'web3'
import * as truffle from '@shared/contracts/truffle'

/**
 * Process the data from a `build/contract/Foo.json` file and
 * turn it into an object that represents the corresponding contract
 */
const loadTruffleContract: <T>(
  data: object
) => IContract<T> = require('truffle-contract')

/**
 * Interface for a general contract which has not yet been resolved to
 * an instance of that contract at a given address.
 */
interface IContract<InstanceType> {
  contractName: string
  deployed(): Promise<InstanceType>
  at(address: string): InstanceType
  setProvider(provider: Web3.Provider): void
}

/**
 * Wrapper around contract data that has not yet been resolved into a contract
 * with a certain provider. In our app, we deal with the same contracts from
 * different accounts (read only accounts, metamask accounts, and specific admin
 * accounts we have). Instead of passing around a contract object, duping it, and
 * then calling `setProvider`, we use this concept of a contract that does not yet
 * have a provider attached to it.
 */
class ContractWithoutProvider<InstanceType> {
  constructor(private truffleDefinition: object, private address: string) {}

  withProvider(provider: Web3.Provider): InstanceType {
    const contract = loadTruffleContract<InstanceType>(this.truffleDefinition)
    contract.setProvider(provider)
    return contract.at(this.address)
  }
}

/**
 * We can't reach directly into the env since the "environment config" is different
 * depending on whether we are client side or server side. Therefore, the file using
 * one of the contracts below should import the respective load function and pass in the
 * address
 */

export function loadUnstableAccountRegistry(address: string) {
  return new ContractWithoutProvider<truffle.IUnstableAccountRegistryInstance>(
    require('./UnstableAccountRegistry.json'),
    address
  )
}

export function loadTokenEscrowMarketplace(address: string) {
  return new ContractWithoutProvider<truffle.ITokenEscrowMarketplaceInstance>(
    require('./TokenEscrowMarketplace.json'),
    address
  )
}

export function loadBLT(address: string) {
  return new ContractWithoutProvider<truffle.IBLTInstance>(
    require('./BLT.json'),
    address
  )
}

export function loadAttestationRepo(address: string) {
  return new ContractWithoutProvider<truffle.IAttestationRepoInstance>(
    require('./AttestationRepo.json'),
    address
  )
}

export function loadAttestationLogic(address: string) {
  return new ContractWithoutProvider<truffle.IAttestationLogicInstance>(
    require('./AttestationLogic.json'),
    address
  )
}
