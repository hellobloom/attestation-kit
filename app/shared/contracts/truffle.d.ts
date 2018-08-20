import * as Web3 from 'web3'
import * as BigNumber from 'bignumber.js'
import {SolidityEvent} from 'web3'

type Address = string
type TransactionOptions = Partial<ITransaction>
type UInt = number | BigNumber.BigNumber

interface ITransaction {
  hash: string
  nonce: number
  blockHash: string | null
  blockNumber: number | null
  transactionIndex: number | null
  from: Address | IContractInstance
  to: string | null
  value: UInt
  gasPrice: UInt
  gas: number
  input: string
}

interface IContractInstance {
  address: string
  sendTransaction(options?: TransactionOptions): Promise<void>
  allEvents(options: {
    fromBlock: number
    toBlock: number | 'latest'
  }): Web3.FilterResult
}

export interface IAccountRegistryInstance extends IContractInstance {
  setInviteCollateralizer: {
    (newInviteCollateralizer: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newInviteCollateralizer: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  inviteCollateralizer: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  setInviteAdmin: {
    (newInviteAdmin: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newInviteAdmin: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  createInvite: {
    (sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    sendTransaction(sig: string, options?: TransactionOptions): Promise<string>
  }
  accounts: {
    (unnamed0: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(unnamed0: Address, options?: TransactionOptions): Promise<boolean>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  invites: {
    (unnamed1: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      unnamed1: Address,
      options?: TransactionOptions
    ): Promise<[Address, Address]>
  }
  createAccount: {
    (newUser: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newUser: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    sendTransaction(
      newUser: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  blt: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  acceptInvite: {
    (sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
  }
}

export interface IAccountRegistryContract {
  new: (
    blt: Address,
    inviteCollateralizer: Address
  ) => Promise<IAccountRegistryInstance>
  deployed(): Promise<IAccountRegistryInstance>
  at(address: string): IAccountRegistryInstance
}

export interface IUnstableAccountRegistryInstance extends IContractInstance {
  accountRegistryLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  accountByAddress: {
    (unnamed0: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed0: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(unnamed0: Address, options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }

  AccountRegistryLogicChanged: Web3.EventFilterCreator<{ oldRegistryLogic: Address; newRegistryLogic: Address }>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  setRegistryLogic: {
    (newRegistryLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newRegistryLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newRegistryLogic: Address, options?: TransactionOptions): Promise<number>
  }
  accountIdForAddress: {
    (address: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(address: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(address: Address, options?: TransactionOptions): Promise<number>
  }
  addressBelongsToAccount: {
    (address: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(address: Address, options?: TransactionOptions): Promise<boolean>
    estimateGas(address: Address, options?: TransactionOptions): Promise<number>
  }
  createNewAccount: {
    (newUser: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newUser: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newUser: Address, options?: TransactionOptions): Promise<number>
  }
  addAddressToAccount: {
    (newAddress: Address, sender: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAddress: Address, sender: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAddress: Address, sender: Address, options?: TransactionOptions): Promise<number>
  }
  removeAddressFromAccount: {
    (addressToRemove: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(addressToRemove: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(addressToRemove: Address, options?: TransactionOptions): Promise<number>
  }
}

export interface IUnstableAccountRegistryContract {
  new: (accountRegistryLogic: Address, options?: TransactionOptions) => Promise<IUnstableAccountRegistryInstance>
  deployed(): Promise<IUnstableAccountRegistryInstance>
  at(address: string): IUnstableAccountRegistryInstance
}

export interface IAccountRegistryLogicInstance extends IContractInstance {
  pendingInvites: {
    (unnamed1: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed1: Address, options?: TransactionOptions): Promise<boolean>
    estimateGas(unnamed1: Address, options?: TransactionOptions): Promise<number>
  }
  signingLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  registryAdmin: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  registry: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }
  usedSignatures: {
    (unnamed2: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed2: string, options?: TransactionOptions): Promise<boolean>
    estimateGas(unnamed2: string, options?: TransactionOptions): Promise<number>
  }

  AccountCreated: Web3.EventFilterCreator<{ accountId: UInt; newUser: Address }>

  InviteCreated: Web3.EventFilterCreator<{ inviter: Address; inviteAddress: Address }>

  InviteAccepted: Web3.EventFilterCreator<{ recipient: Address; inviteAddress: Address }>

  AddressAdded: Web3.EventFilterCreator<{ accountId: UInt; newAddress: Address }>

  AddressRemoved: Web3.EventFilterCreator<{ accountId: UInt; oldAddress: Address }>

  RegistryAdminChanged: Web3.EventFilterCreator<{ oldRegistryAdmin: Address; newRegistryAdmin: Address }>

  SigningLogicChanged: Web3.EventFilterCreator<{ oldSigningLogic: Address; newSigningLogic: Address }>

  AccountRegistryChanged: Web3.EventFilterCreator<{ oldRegistry: Address; newRegistry: Address }>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  setSigningLogic: {
    (newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newSigningLogic: Address, options?: TransactionOptions): Promise<number>
  }
  setRegistryAdmin: {
    (newRegistryAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newRegistryAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newRegistryAdmin: Address, options?: TransactionOptions): Promise<number>
  }
  setAccountRegistry: {
    (newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newRegistry: Address, options?: TransactionOptions): Promise<number>
  }
  createInvite: {
    (sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(sig: string, options?: TransactionOptions): Promise<number>
  }
  acceptInvite: {
    (sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(sig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(sig: string, options?: TransactionOptions): Promise<number>
  }
  createAccount: {
    (newUser: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newUser: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newUser: Address, options?: TransactionOptions): Promise<number>
  }
  addAddressToAccountFor: {
    (newAddress: Address, newAddressSig: string, senderSig: string, sender: Address, nonce: string, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newAddress: Address,
      newAddressSig: string,
      senderSig: string,
      sender: Address,
      nonce: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      newAddress: Address,
      newAddressSig: string,
      senderSig: string,
      sender: Address,
      nonce: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  addAddressToAccount: {
    (newAddress: Address, newAddressSig: string, senderSig: string, nonce: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAddress: Address, newAddressSig: string, senderSig: string, nonce: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAddress: Address, newAddressSig: string, senderSig: string, nonce: string, options?: TransactionOptions): Promise<number>
  }
  removeAddressFromAccountFor: {
    (addressToRemove: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(addressToRemove: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(addressToRemove: Address, options?: TransactionOptions): Promise<number>
  }
}

export interface IAccountRegistryLogicContract {
  new: (signingLogic: Address, registry: Address, options?: TransactionOptions) => Promise<IAccountRegistryLogicInstance>
  deployed(): Promise<IAccountRegistryLogicInstance>
  at(address: string): IAccountRegistryLogicInstance
}

export interface IApproveAndCallFallBackInstance extends IContractInstance {
  receiveApproval: {
    (
      from: Address,
      amount: UInt,
      token: Address,
      data: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      from: Address,
      amount: UInt,
      token: Address,
      data: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IApproveAndCallFallBackContract {
  new: () => Promise<IApproveAndCallFallBackInstance>
  deployed(): Promise<IApproveAndCallFallBackInstance>
  at(address: string): IApproveAndCallFallBackInstance
}

export interface IBLTInstance extends IContractInstance {
  tokenGrantsCount: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  name: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  approve: {
    (spender: Address, amount: string, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      spender: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
    sendTransaction(
      spender: Address,
      amount: string,
      options?: TransactionOptions
    ): Promise<string>
  }
  spendableBalanceOf: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  creationBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  totalSupply: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  canCreateGrants: {
    (unnamed2: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(unnamed2: Address, options?: TransactionOptions): Promise<boolean>
  }
  setCanCreateGrants: {
    (addr: Address, allowed: boolean, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      addr: Address,
      allowed: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  transferFrom: {
    (from: Address, to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      from: Address,
      to: Address,
      value: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  grants: {
    (unnamed3: Address, unnamed4: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      unnamed3: Address,
      unnamed4: UInt,
      options?: TransactionOptions
    ): Promise<
      [
        Address,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        boolean,
        boolean
      ]
    >
  }
  decimals: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  changeController: {
    (newController: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newController: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  balanceOfAt: {
    (owner: Address, blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  version: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  tokenGrant: {
    (holder: Address, grantId: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      holder: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<
      [
        Address,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        boolean,
        boolean
      ]
    >
  }
  createCloneToken: {
    (
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Address>
  }
  lastTokenIsTransferableDate: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  balanceOf: {
    (owner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(owner: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  parentToken: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  generateTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  symbol: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  grantVestedTokens: {
    (
      to: Address,
      value: UInt,
      start: UInt,
      cliff: UInt,
      vesting: UInt,
      revokable: boolean,
      burnsOnRevoke: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      to: Address,
      value: UInt,
      start: UInt,
      cliff: UInt,
      vesting: UInt,
      revokable: boolean,
      burnsOnRevoke: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  totalSupplyAt: {
    (blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  transfer: {
    (to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    sendTransaction(
      to: Address,
      value: UInt,
      options?: TransactionOptions
    ): Promise<string>
    call(to: Address, value: UInt, options?: TransactionOptions): Promise<boolean>
  }
  revokeTokenGrant: {
    (
      holder: Address,
      receiver: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      holder: Address,
      receiver: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  transfersEnabled: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
  }
  parentSnapShotBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  approveAndCall: {
    (
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  transferableTokens: {
    (holder: Address, time: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      holder: Address,
      time: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  destroyTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  allowance: {
    (owner: Address, spender: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      spender: Address,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  claimTokens: {
    (token: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      token: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  vestingWhitelister: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  tokenFactory: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  enableTransfers: {
    (transfersEnabled: boolean, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  controller: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  changeVestingWhitelister: {
    (newWhitelister: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newWhitelister: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IBLTContract {
  new: (tokenFactory: Address) => Promise<IBLTInstance>
  deployed(): Promise<IBLTInstance>
  at(address: string): IBLTInstance
}

export interface IControlledInstance extends IContractInstance {
  changeController: {
    (newController: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newController: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  controller: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
}

export interface IControlledContract {
  new: () => Promise<IControlledInstance>
  deployed(): Promise<IControlledInstance>
  at(address: string): IControlledInstance
}

export interface IConvertLibInstance extends IContractInstance {
  convert: {
    (amount: UInt, conversionRate: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      amount: UInt,
      conversionRate: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
}

export interface IConvertLibContract {
  new: () => Promise<IConvertLibInstance>
  deployed(): Promise<IConvertLibInstance>
  at(address: string): IConvertLibInstance
}

export interface IDependentOnIPFSInstance extends IContractInstance {}

export interface IDependentOnIPFSContract {
  new: () => Promise<IDependentOnIPFSInstance>
  deployed(): Promise<IDependentOnIPFSInstance>
  at(address: string): IDependentOnIPFSInstance
}

export interface IECRecoveryInstance extends IContractInstance {
  recover: {
    (hash: string, sig: string, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(hash: string, sig: string, options?: TransactionOptions): Promise<Address>
  }
}

export interface IECRecoveryContract {
  new: () => Promise<IECRecoveryInstance>
  deployed(): Promise<IECRecoveryInstance>
  at(address: string): IECRecoveryInstance
}

export interface IERC20Instance extends IContractInstance {
  approve: {
    (spender: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      spender: Address,
      value: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  totalSupply: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  transferFrom: {
    (from: Address, to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      from: Address,
      to: Address,
      value: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  balanceOf: {
    (who: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(who: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  transfer: {
    (to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(to: Address, value: UInt, options?: TransactionOptions): Promise<boolean>
  }
  allowance: {
    (owner: Address, spender: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      spender: Address,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
}

export interface IERC20Contract {
  new: () => Promise<IERC20Instance>
  deployed(): Promise<IERC20Instance>
  at(address: string): IERC20Instance
}

export interface IERC20BasicInstance extends IContractInstance {
  totalSupply: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  balanceOf: {
    (who: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(who: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  transfer: {
    (to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(to: Address, value: UInt, options?: TransactionOptions): Promise<boolean>
  }
}

export interface IERC20BasicContract {
  new: () => Promise<IERC20BasicInstance>
  deployed(): Promise<IERC20BasicInstance>
  at(address: string): IERC20BasicInstance
}

export interface IInviteCollateralizerInstance extends IContractInstance {
  changeLockupDuration: {
    (newLockupDuration: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newLockupDuration: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  seizedTokensWallet: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  lockupDuration: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  changeCollateralTaker: {
    (newCollateralTaker: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newCollateralTaker: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  changeCollateralAmount: {
    (newAmount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      newAmount: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  changeSeizedTokensWallet: {
    (newSeizedTokensWallet: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newSeizedTokensWallet: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  collateralizations: {
    (unnamed5: Address, unnamed6: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      unnamed5: Address,
      unnamed6: UInt,
      options?: TransactionOptions
    ): Promise<[BigNumber.BigNumber, BigNumber.BigNumber, boolean]>
  }
  reclaim: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
  }
  changeCollateralSeizer: {
    (newCollateralSeizer: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newCollateralSeizer: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  collateralAmount: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  blt: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  takeCollateral: {
    (owner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(owner: Address, options?: TransactionOptions): Promise<boolean>
  }
  seize: {
    (subject: Address, collateralId: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      subject: Address,
      collateralId: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IInviteCollateralizerContract {
  new: (
    blt: Address,
    seizedTokensWallet: Address
  ) => Promise<IInviteCollateralizerInstance>
  deployed(): Promise<IInviteCollateralizerInstance>
  at(address: string): IInviteCollateralizerInstance
}

export interface IMathInstance extends IContractInstance {}

export interface IMathContract {
  new: () => Promise<IMathInstance>
  deployed(): Promise<IMathInstance>
  at(address: string): IMathInstance
}

export interface IMetaCoinInstance extends IContractInstance {
  getBalanceInEth: {
    (addr: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(addr: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  sendCoin: {
    (receiver: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      receiver: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  getBalance: {
    (addr: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(addr: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
}

export interface IMetaCoinContract {
  new: () => Promise<IMetaCoinInstance>
  deployed(): Promise<IMetaCoinInstance>
  at(address: string): IMetaCoinInstance
}

export interface IMigrationsInstance extends IContractInstance {
  upgrade: {
    (newAddress: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newAddress: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  last_completed_migration: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  setCompleted: {
    (completed: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      completed: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IMigrationsContract {
  new: () => Promise<IMigrationsInstance>
  deployed(): Promise<IMigrationsInstance>
  at(address: string): IMigrationsInstance
}

export interface IMiniMeTokenInstance extends IContractInstance {
  name: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  approve: {
    (spender: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      spender: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  creationBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  totalSupply: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  transferFrom: {
    (
      from: Address,
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      from: Address,
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  decimals: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  changeController: {
    (newController: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newController: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  balanceOfAt: {
    (owner: Address, blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  version: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  createCloneToken: {
    (
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Address>
  }
  balanceOf: {
    (owner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(owner: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  parentToken: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  generateTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  symbol: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  totalSupplyAt: {
    (blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  transfer: {
    (to: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(to: Address, amount: UInt, options?: TransactionOptions): Promise<boolean>
  }
  transfersEnabled: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
  }
  parentSnapShotBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  approveAndCall: {
    (
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  destroyTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  allowance: {
    (owner: Address, spender: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      spender: Address,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  claimTokens: {
    (token: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      token: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  tokenFactory: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  enableTransfers: {
    (transfersEnabled: boolean, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  controller: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
}

export interface IMiniMeTokenContract {
  new: (
    tokenFactory: Address,
    parentToken: Address,
    parentSnapShotBlock: UInt,
    tokenName: string,
    decimalUnits: UInt,
    tokenSymbol: string,
    transfersEnabled: boolean
  ) => Promise<IMiniMeTokenInstance>
  deployed(): Promise<IMiniMeTokenInstance>
  at(address: string): IMiniMeTokenInstance
}

export interface IMiniMeTokenFactoryInstance extends IContractInstance {
  createCloneToken: {
    (
      parentToken: Address,
      snapshotBlock: UInt,
      tokenName: string,
      decimalUnits: UInt,
      tokenSymbol: string,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      parentToken: Address,
      snapshotBlock: UInt,
      tokenName: string,
      decimalUnits: UInt,
      tokenSymbol: string,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Address>
  }
}

export interface IMiniMeTokenFactoryContract {
  new: () => Promise<IMiniMeTokenFactoryInstance>
  deployed(): Promise<IMiniMeTokenFactoryInstance>
  at(address: string): IMiniMeTokenFactoryInstance
}

export interface IMiniMeVestedTokenInstance extends IContractInstance {
  tokenGrantsCount: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  name: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  approve: {
    (spender: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      spender: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  spendableBalanceOf: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  creationBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  totalSupply: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  canCreateGrants: {
    (unnamed7: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(unnamed7: Address, options?: TransactionOptions): Promise<boolean>
  }
  setCanCreateGrants: {
    (addr: Address, allowed: boolean, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      addr: Address,
      allowed: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  transferFrom: {
    (from: Address, to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      from: Address,
      to: Address,
      value: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  grants: {
    (unnamed8: Address, unnamed9: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      unnamed8: Address,
      unnamed9: UInt,
      options?: TransactionOptions
    ): Promise<
      [
        Address,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        boolean,
        boolean
      ]
    >
  }
  decimals: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  changeController: {
    (newController: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newController: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  balanceOfAt: {
    (owner: Address, blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  version: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  tokenGrant: {
    (holder: Address, grantId: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      holder: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<
      [
        Address,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        BigNumber.BigNumber,
        boolean,
        boolean
      ]
    >
  }
  createCloneToken: {
    (
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      cloneTokenName: string,
      cloneDecimalUnits: UInt,
      cloneTokenSymbol: string,
      snapshotBlock: UInt,
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Address>
  }
  lastTokenIsTransferableDate: {
    (holder: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(holder: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  balanceOf: {
    (owner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(owner: Address, options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  parentToken: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  generateTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  symbol: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
  }
  grantVestedTokens: {
    (
      to: Address,
      value: UInt,
      start: UInt,
      cliff: UInt,
      vesting: UInt,
      revokable: boolean,
      burnsOnRevoke: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      to: Address,
      value: UInt,
      start: UInt,
      cliff: UInt,
      vesting: UInt,
      revokable: boolean,
      burnsOnRevoke: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  totalSupplyAt: {
    (blockNumber: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      blockNumber: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  transfer: {
    (to: Address, value: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(to: Address, value: UInt, options?: TransactionOptions): Promise<boolean>
  }
  revokeTokenGrant: {
    (
      holder: Address,
      receiver: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      holder: Address,
      receiver: Address,
      grantId: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  transfersEnabled: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
  }
  parentSnapShotBlock: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
  }
  approveAndCall: {
    (
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      spender: Address,
      amount: UInt,
      extraData: string,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  transferableTokens: {
    (holder: Address, time: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      holder: Address,
      time: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  destroyTokens: {
    (owner: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  allowance: {
    (owner: Address, spender: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      owner: Address,
      spender: Address,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
  }
  claimTokens: {
    (token: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      token: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  vestingWhitelister: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  tokenFactory: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  enableTransfers: {
    (transfersEnabled: boolean, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      transfersEnabled: boolean,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
  controller: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  changeVestingWhitelister: {
    (newWhitelister: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newWhitelister: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IMiniMeVestedTokenContract {
  new: (
    tokenFactory: Address,
    parentToken: Address,
    parentSnapShotBlock: UInt,
    tokenName: string,
    decimalUnits: UInt,
    tokenSymbol: string,
    transfersEnabled: boolean
  ) => Promise<IMiniMeVestedTokenInstance>
  deployed(): Promise<IMiniMeVestedTokenInstance>
  at(address: string): IMiniMeVestedTokenInstance
}

export interface IOwnableInstance extends IContractInstance {
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
  }
}

export interface IOwnableContract {
  new: () => Promise<IOwnableInstance>
  deployed(): Promise<IOwnableInstance>
  at(address: string): IOwnableInstance
}

export interface IPollInstance extends IContractInstance {
  endTime: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  votes: {
    (unnamed22: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed22: UInt, options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(unnamed22: UInt, options?: TransactionOptions): Promise<number>
  }
  startTime: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  registry: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  pollDataMultihash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  author: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  numChoices: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(options?: TransactionOptions): Promise<number>
  }

  vote: {
    (choice: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      choice: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(choice: UInt, options?: TransactionOptions): Promise<number>
  }
}

export interface IPollContract {
  new: (
    ipfsHash: string,
    numChoices: UInt,
    startTime: UInt,
    endTime: UInt,
    author: Address,
    registry: Address,
    options?: TransactionOptions
  ) => Promise<IPollInstance>
  deployed(): Promise<IPollInstance>
  at(address: string): IPollInstance
}

export interface ISafeERC20Instance extends IContractInstance {}

export interface ISafeERC20Contract {
  new: () => Promise<ISafeERC20Instance>
  deployed(): Promise<ISafeERC20Instance>
  at(address: string): ISafeERC20Instance
}

export interface ISafeMathInstance extends IContractInstance {}

export interface ISafeMathContract {
  new: () => Promise<ISafeMathInstance>
  deployed(): Promise<ISafeMathInstance>
  at(address: string): ISafeMathInstance
}

export interface ITokenControllerInstance extends IContractInstance {
  onTransfer: {
    (
      from: Address,
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      from: Address,
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  onApprove: {
    (
      owner: Address,
      spender: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      owner: Address,
      spender: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<boolean>
  }
  proxyPayment: {
    (owner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(owner: Address, options?: TransactionOptions): Promise<boolean>
  }
}

export interface ITokenControllerContract {
  new: () => Promise<ITokenControllerInstance>
  deployed(): Promise<ITokenControllerInstance>
  at(address: string): ITokenControllerInstance
}

export interface IVotingCenterInstance extends IContractInstance {
  polls: {
    (unnamed26: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed26: UInt, options?: TransactionOptions): Promise<Address>
    estimateGas(unnamed26: UInt, options?: TransactionOptions): Promise<number>
  }

  createPoll: {
    (
      ipfsHash: string,
      numOptions: UInt,
      startTime: UInt,
      endTime: UInt,
      registry: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      ipfsHash: string,
      numOptions: UInt,
      startTime: UInt,
      endTime: UInt,
      registry: Address,
      options?: TransactionOptions
    ): Promise<Address>
    estimateGas(
      ipfsHash: string,
      numOptions: UInt,
      startTime: UInt,
      endTime: UInt,
      registry: Address,
      options?: TransactionOptions
    ): Promise<number>
  }
  allPolls: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address[]>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  numPolls: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
}

export interface IVotingCenterContract {
  new: (options?: TransactionOptions) => Promise<IVotingCenterInstance>
  deployed(): Promise<IVotingCenterInstance>
  at(address: string): IVotingCenterInstance
}

export interface IAttestationRepoInstance extends IContractInstance {
  attestationLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  unpause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  paused: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  pause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  attestations: {
    (unnamed6: UInt, unnamed7: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      unnamed6: UInt,
      unnamed7: UInt,
      options?: TransactionOptions
    ): Promise<[BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber]>
    estimateGas(unnamed6: UInt, unnamed7: UInt, options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }
  token: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }

  AttestationLogicChanged: Web3.EventFilterCreator<{ oldAttestationLogic: Address; newAttestationLogic: Address }>

  Pause: Web3.EventFilterCreator<{}>

  Unpause: Web3.EventFilterCreator<{}>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  setAttestationLogic: {
    (newAttestationLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAttestationLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAttestationLogic: Address, options?: TransactionOptions): Promise<number>
  }
  writeAttestation: {
    (subjectId: UInt, attesterId: UInt, timestamp: UInt, stakeValue: UInt, expiresAt: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      subjectId: UInt,
      attesterId: UInt,
      timestamp: UInt,
      stakeValue: UInt,
      expiresAt: UInt,
      options?: TransactionOptions
    ): Promise<BigNumber.BigNumber>
    estimateGas(subjectId: UInt, attesterId: UInt, timestamp: UInt, stakeValue: UInt, expiresAt: UInt, options?: TransactionOptions): Promise<number>
  }
  readAttestation: {
    (subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(
      subjectId: UInt,
      attestationId: UInt,
      options?: TransactionOptions
    ): Promise<[BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber]>
    estimateGas(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<number>
  }
  revokeAttestation: {
    (subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<number>
  }
  writeStake: {
    (subjectId: UInt, attestationId: UInt, stakeValue: UInt, expiresAt: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, attestationId: UInt, stakeValue: UInt, expiresAt: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, attestationId: UInt, stakeValue: UInt, expiresAt: UInt, options?: TransactionOptions): Promise<number>
  }
  transferTokensToStaker: {
    (staker: Address, value: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(staker: Address, value: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(staker: Address, value: UInt, options?: TransactionOptions): Promise<number>
  }
}

export interface IAttestationRepoContract {
  new: (token: Address, attestationLogic: Address, options?: TransactionOptions) => Promise<IAttestationRepoInstance>
  deployed(): Promise<IAttestationRepoInstance>
  at(address: string): IAttestationRepoInstance
}

export interface IAttestationLogicInstance extends IContractInstance {
  attestationRepo: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  signingLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  tokenEscrowMarketplace: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  permittedTypesList: {
    (unnamed4: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed4: UInt, options?: TransactionOptions): Promise<string>
    estimateGas(unnamed4: UInt, options?: TransactionOptions): Promise<number>
  }
  registry: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }
  admin: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  usedSignatures: {
    (unnamed5: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed5: string, options?: TransactionOptions): Promise<boolean>
    estimateGas(unnamed5: string, options?: TransactionOptions): Promise<number>
  }

  TraitAttested: Web3.EventFilterCreator<{
    attestationId: UInt
    subjectId: UInt
    attesterId: UInt
    requesterId: UInt
    dataHash: string
    typeIds: UInt[]
    stakeValue: UInt
    expiresAt: UInt
  }>

  AttestationRejected: Web3.EventFilterCreator<{ attesterId: UInt; requesterId: UInt }>

  AttestationRevoked: Web3.EventFilterCreator<{ subjectId: UInt; attestationId: UInt; revokerId: UInt }>

  TypeCreated: Web3.EventFilterCreator<{ traitType: string }>

  StakeSubmitted: Web3.EventFilterCreator<{ subjectId: UInt; stakerId: UInt; attestationId: UInt; expiresAt: UInt }>

  StakedTokensReclaimed: Web3.EventFilterCreator<{ stakerId: UInt; value: UInt }>

  AccountRegistryChanged: Web3.EventFilterCreator<{ oldRegistry: Address; newRegistry: Address }>

  AttestationRepoChanged: Web3.EventFilterCreator<{ oldAttestationRepo: Address; newAttestationRepo: Address }>

  SigningLogicChanged: Web3.EventFilterCreator<{ oldSigningLogic: Address; newSigningLogic: Address }>

  TokenEscrowMarketplaceChanged: Web3.EventFilterCreator<{ oldTokenEscrowMarketplace: Address; newTokenEscrowMarketplace: Address }>

  AdminChanged: Web3.EventFilterCreator<{ oldAdmin: Address; newAdmin: Address }>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  attest: {
    (
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  attestFor: {
    (
      subject: Address,
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  contest: {
    (requester: Address, reward: UInt, paymentNonce: string, requesterSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(requester: Address, reward: UInt, paymentNonce: string, requesterSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(requester: Address, reward: UInt, paymentNonce: string, requesterSig: string, options?: TransactionOptions): Promise<number>
  }
  contestFor: {
    (
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      attester: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  validateSubjectSig: {
    (
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  createType: {
    (traitType: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(traitType: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(traitType: string, options?: TransactionOptions): Promise<number>
  }
  traitTypesExist: {
    (typeIds: UInt[], options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(typeIds: UInt[], options?: TransactionOptions): Promise<boolean>
    estimateGas(typeIds: UInt[], options?: TransactionOptions): Promise<number>
  }
  revokeAttestation: {
    (subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<number>
  }
  stake: {
    (
      subject: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      options?: TransactionOptions
    ): Promise<number>
  }
  stakeFor: {
    (
      subject: Address,
      staker: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      staker: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      staker: Address,
      value: UInt,
      paymentNonce: string,
      paymentSig: string,
      dataHash: string,
      typeIds: UInt[],
      requestNonce: string,
      subjectSig: string,
      stakeDuration: UInt,
      delegationSig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  reclaimStakedTokens: {
    (attestationId: UInt, subjectId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(attestationId: UInt, subjectId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(attestationId: UInt, subjectId: UInt, options?: TransactionOptions): Promise<number>
  }
  reclaimStakedTokensFor: {
    (subjectId: UInt, staker: Address, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, staker: Address, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, staker: Address, attestationId: UInt, options?: TransactionOptions): Promise<number>
  }
  revokeStake: {
    (subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, attestationId: UInt, options?: TransactionOptions): Promise<number>
  }
  revokeStakeFor: {
    (subjectId: UInt, staker: Address, attestationId: UInt, delegationSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(subjectId: UInt, staker: Address, attestationId: UInt, delegationSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(subjectId: UInt, staker: Address, attestationId: UInt, delegationSig: string, options?: TransactionOptions): Promise<number>
  }
  setAdmin: {
    (newAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAdmin: Address, options?: TransactionOptions): Promise<number>
  }
  setAccountRegistry: {
    (newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newRegistry: Address, options?: TransactionOptions): Promise<number>
  }
  setSigningLogic: {
    (newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newSigningLogic: Address, options?: TransactionOptions): Promise<number>
  }
  setAttestationRepo: {
    (newAttestationRepo: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAttestationRepo: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAttestationRepo: Address, options?: TransactionOptions): Promise<number>
  }
  setTokenEscrowMarketplace: {
    (newTokenEscrowMarketplace: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newTokenEscrowMarketplace: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newTokenEscrowMarketplace: Address, options?: TransactionOptions): Promise<number>
  }
}

export interface IAttestationLogicContract {
  new: (
    registry: Address,
    attestationRepo: Address,
    signingLogic: Address,
    tokenEscrowMarketplace: Address,
    options?: TransactionOptions
  ) => Promise<IAttestationLogicInstance>
  deployed(): Promise<IAttestationLogicInstance>
  at(address: string): IAttestationLogicInstance
}

export interface IAttestationLogicUpgradeModeInstance extends IContractInstance {
  attestationRepo: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  registry: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }

  TraitAttested: Web3.EventFilterCreator<{
    attestationId: UInt
    subjectId: UInt
    attesterId: UInt
    requesterId: UInt
    dataHash: string
    typeIds: UInt[]
    stakeValue: UInt
    expiresAt: UInt
  }>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  proxyWriteAttestation: {
    (
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      timestamp: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      timestamp: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeIds: UInt[],
      timestamp: UInt,
      options?: TransactionOptions
    ): Promise<number>
  }
}

export interface IAttestationLogicUpgradeModeContract {
  new: (registry: Address, attestationRepo: Address, options?: TransactionOptions) => Promise<IAttestationLogicUpgradeModeInstance>
  deployed(): Promise<IAttestationLogicUpgradeModeInstance>
  at(address: string): IAttestationLogicUpgradeModeInstance
}

export interface ISigningLogicInstance extends IContractInstance {
  attestForDelegationSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  voteForSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  addAddressSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  requestAttestationSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  releaseTokensSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  lockupTokensDelegationSchemaHash: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<string>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  recoverSigner: {
    (hash: string, sig: string, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(hash: string, sig: string, options?: TransactionOptions): Promise<Address>
    estimateGas(
      hash: string,
      sig: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateRequestAttestationSchemaHash: {
    (
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeHash: string,
      nonce: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeHash: string,
      nonce: string,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      subject: Address,
      attester: Address,
      requester: Address,
      dataHash: string,
      typeHash: string,
      nonce: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateAttestForDelegationSchemaHash: {
    (
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeHash: string,
      requestNonce: string,
      subjectSig: string,
      decisionId: UInt,
      certainty: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeHash: string,
      requestNonce: string,
      subjectSig: string,
      decisionId: UInt,
      certainty: UInt,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      subject: Address,
      requester: Address,
      reward: UInt,
      paymentNonce: string,
      requesterSig: string,
      dataHash: string,
      typeHash: string,
      requestNonce: string,
      subjectSig: string,
      decisionId: UInt,
      certainty: UInt,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateAddAddressSchemaHash: {
    (
      senderAddress: Address,
      accountType: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      senderAddress: Address,
      accountType: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      senderAddress: Address,
      accountType: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateVoteForDelegationSchemaHash: {
    (
      choice: UInt,
      voter: Address,
      nonce: string,
      poll: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      choice: UInt,
      voter: Address,
      nonce: string,
      poll: Address,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      choice: UInt,
      voter: Address,
      nonce: string,
      poll: Address,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateLockupTokensDelegationSchemaHash: {
    (
      sender: Address,
      amount: UInt,
      lockupDuration: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      sender: Address,
      amount: UInt,
      lockupDuration: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      sender: Address,
      amount: UInt,
      lockupDuration: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<number>
  }
  generateReleaseTokensSchemaHash: {
    (
      sender: Address,
      receiver: Address,
      amount: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    call(
      sender: Address,
      receiver: Address,
      amount: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<string>
    estimateGas(
      sender: Address,
      receiver: Address,
      amount: UInt,
      nonce: string,
      options?: TransactionOptions
    ): Promise<number>
  }
}

export interface ISigningLogicContract {
  new: (options?: TransactionOptions) => Promise<ISigningLogicInstance>
  deployed(): Promise<ISigningLogicInstance>
  at(address: string): ISigningLogicInstance
}

export interface IPausableInstance extends IContractInstance {
  paused: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }

  pause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  unpause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
}

export interface IPausableContract {
  new: (options?: TransactionOptions) => Promise<IPausableInstance>
  deployed(): Promise<IPausableInstance>
  at(address: string): IPausableInstance
}

export interface IAirdropProxyInstance extends IContractInstance {
  unpause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  paused: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  pause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  reclaimEther: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }
  token: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }

  addManager: {
    (manager: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      manager: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(manager: Address, options?: TransactionOptions): Promise<number>
  }
  removeManager: {
    (oldManager: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      oldManager: Address,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(oldManager: Address, options?: TransactionOptions): Promise<number>
  }
  airdrop: {
    (to: Address, amount: UInt, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(
      to: Address,
      amount: UInt,
      options?: TransactionOptions
    ): Promise<number>
  }
  isManager: {
    (address: Address, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(address: Address, options?: TransactionOptions): Promise<boolean>
    estimateGas(address: Address, options?: TransactionOptions): Promise<number>
  }
  withdrawAllTokens: {
    (to: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(to: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(to: Address, options?: TransactionOptions): Promise<number>
  }
}

export interface IAirdropProxyContract {
  new: (
    token: Address,
    options?: TransactionOptions
  ) => Promise<IAirdropProxyInstance>
  deployed(): Promise<IAirdropProxyInstance>
  at(address: string): IAirdropProxyInstance
}

export interface ITokenEscrowMarketplaceInstance extends IContractInstance {
  attestationLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  unpause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  signingLogic: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  paused: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<boolean>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  registry: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  pause: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  owner: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  marketplaceAdmin: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }
  transferOwnership: {
    (newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newOwner: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newOwner: Address, options?: TransactionOptions): Promise<number>
  }
  tokenEscrow: {
    (unnamed16: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed16: UInt, options?: TransactionOptions): Promise<BigNumber.BigNumber>
    estimateGas(unnamed16: UInt, options?: TransactionOptions): Promise<number>
  }
  usedSignatures: {
    (unnamed17: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(unnamed17: string, options?: TransactionOptions): Promise<boolean>
    estimateGas(unnamed17: string, options?: TransactionOptions): Promise<number>
  }
  token: {
    (options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(options?: TransactionOptions): Promise<Address>
    estimateGas(options?: TransactionOptions): Promise<number>
  }

  TokenMarketplaceWithdrawal: Web3.EventFilterCreator<{ subject: UInt; amount: UInt }>

  TokenMarketplaceEscrowPayment: Web3.EventFilterCreator<{ escrowPayer: UInt; escrowPayee: Address; amount: UInt }>

  TokenMarketplaceDeposit: Web3.EventFilterCreator<{ escrowPayer: UInt; amount: UInt }>

  SigningLogicChanged: Web3.EventFilterCreator<{ oldSigningLogic: Address; newSigningLogic: Address }>

  AttestationLogicChanged: Web3.EventFilterCreator<{ oldAttestationLogic: Address; newAttestationLogic: Address }>

  AccountRegistryChanged: Web3.EventFilterCreator<{ oldRegistry: Address; newRegistry: Address }>

  MarketplaceAdminChanged: Web3.EventFilterCreator<{ oldMarketplaceAdmin: Address; newMarketplaceAdmin: Address }>

  Pause: Web3.EventFilterCreator<{}>

  Unpause: Web3.EventFilterCreator<{}>

  OwnershipTransferred: Web3.EventFilterCreator<{ previousOwner: Address; newOwner: Address }>

  setMarketplaceAdmin: {
    (newMarketplaceAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newMarketplaceAdmin: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newMarketplaceAdmin: Address, options?: TransactionOptions): Promise<number>
  }
  setSigningLogic: {
    (newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newSigningLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newSigningLogic: Address, options?: TransactionOptions): Promise<number>
  }
  setAttestationLogic: {
    (newAttestationLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newAttestationLogic: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newAttestationLogic: Address, options?: TransactionOptions): Promise<number>
  }
  setAccountRegistry: {
    (newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(newRegistry: Address, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(newRegistry: Address, options?: TransactionOptions): Promise<number>
  }
  moveTokensToEscrowLockupFor: {
    (sender: Address, amount: UInt, nonce: string, delegationSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(sender: Address, amount: UInt, nonce: string, delegationSig: string, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(sender: Address, amount: UInt, nonce: string, delegationSig: string, options?: TransactionOptions): Promise<number>
  }
  moveTokensToEscrowLockup: {
    (amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(amount: UInt, options?: TransactionOptions): Promise<number>
  }
  releaseTokensFromEscrow: {
    (amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(amount: UInt, options?: TransactionOptions): Promise<number>
  }
  releaseTokensFromEscrowFor: {
    (payer: Address, amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    call(payer: Address, amount: UInt, options?: TransactionOptions): Promise<Web3.TransactionReceipt>
    estimateGas(payer: Address, amount: UInt, options?: TransactionOptions): Promise<number>
  }
  requestTokenPayment: {
    (payer: Address, receiver: Address, amount: UInt, nonce: string, releaseSig: string, options?: TransactionOptions): Promise<
      Web3.TransactionReceipt
    >
    call(
      payer: Address,
      receiver: Address,
      amount: UInt,
      nonce: string,
      releaseSig: string,
      options?: TransactionOptions
    ): Promise<Web3.TransactionReceipt>
    estimateGas(payer: Address, receiver: Address, amount: UInt, nonce: string, releaseSig: string, options?: TransactionOptions): Promise<number>
  }
}

export interface ITokenEscrowMarketplaceContract {
  new: (
    token: Address,
    registry: Address,
    signingLogic: Address,
    attestationLogic: Address,
    options?: TransactionOptions
  ) => Promise<ITokenEscrowMarketplaceInstance>
  deployed(): Promise<ITokenEscrowMarketplaceInstance>
  at(address: string): ITokenEscrowMarketplaceInstance
}
