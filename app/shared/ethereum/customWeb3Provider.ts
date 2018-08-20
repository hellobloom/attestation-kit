import * as Web3 from 'web3'
import {toBuffer} from 'ethereumjs-util'
import * as ethereumjsWallet from 'ethereumjs-wallet'
const ProviderEngine = require('web3-provider-engine')
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters')
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet')
const Web3Subprovider = require('web3-provider-engine/subproviders/web3')

import {env} from '@shared/environment'

/**
 * Create an ethereumjs-wallet object from a hex encoded string private key
 *
 * @param privateKey Private key string we want to create a wallet from
 */
export const walletFor = (privateKey: string) =>
  ethereumjsWallet.fromPrivateKey(toBuffer(privateKey))

/**
 * Compose our own web3 provider so that we can configure the clients to use
 * a private key we already have.
 *
 * @param privateKey Private key we want to import into our engine
 *
 * @see https://yohanes.gultom.me/configure-truffle-to-use-infura-io-and-existing-private-key/
 * @see https://git.io/vb5x3 Composable provider engines
 */
export function privateEngine(
  privateKey: string,
  options: {stage: 'testnet' | 'mainnet'} = {stage: 'mainnet'}
): Web3.Provider {
  const engine = new ProviderEngine()

  /**
   * The WalletSubprovider exposes functionality for signing a transaction. This lets
   * us actually use our own private keys.
   */
  engine.addProvider(new WalletSubprovider(walletFor(privateKey), {}))

  /**
   * Add a web3 subprovider which gives us the bare minimum functionality for actually
   * creating, sending, and handling web requests
   */
  const httpProvider = new Web3.providers.HttpProvider(
    options.stage === 'mainnet' ? env.web3Provider : env.rinkebyWeb3Provider
  )
  engine.addProvider(new Web3Subprovider(httpProvider))

  /**
   * Tell the engine it can start polling our provider to get the current block number.
   * The engine doesn't know if it is setup properly until it observes at least one
   * block from the provider
   *
   * @see https://git.io/vb5xa
   */
  engine.start()

  return engine
}

export function readOnlyEngine(
  options: {stage: 'testnet' | 'mainnet'} = {stage: 'mainnet'}
): Web3.Provider {
  const engine = new ProviderEngine()

  /**
   * Add support for "filtering" calls within the web3 protocol which allows
   * us to query for events and add constraints like the starting block, ending block,
   * and ETH address that created the events.
   */
  engine.addProvider(new FiltersSubprovider())

  /**
   * Add a web3 subprovider which gives us the bare minimum functionality for actually
   * creating, sending, and handling web requests
   */
  const httpProvider = new Web3.providers.HttpProvider(
    options.stage === 'mainnet' ? env.web3Provider : env.rinkebyWeb3Provider
  )
  engine.addProvider(new Web3Subprovider(httpProvider))

  /**
   * Tell the engine it can start polling our provider to get the current block number.
   * The engine doesn't know if it is setup properly until it observes at least one
   * block from the provider
   *
   * @see https://git.io/vb5xa
   */
  engine.start()

  return engine
}
