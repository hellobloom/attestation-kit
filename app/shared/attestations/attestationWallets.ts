import * as Wallet from 'ethereumjs-wallet'
import {env} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'

export const primaryWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(env.owner.ethPrivKey)
)

export const attesterWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(env.owner.ethPrivKey)
)

export const requesterWallet: Wallet.Wallet = Wallet.fromPrivateKey(
  toBuffer(env.owner.ethPrivKey)
)
