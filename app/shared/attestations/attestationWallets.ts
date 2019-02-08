import * as Wallet from 'ethereumjs-wallet'
import {env} from '@shared/environment'
import {toBuffer} from 'ethereumjs-util'

let envPr = env()

export const primaryWallet: Promise<Wallet.Wallet> = envPr.then(e =>
  Wallet.fromPrivateKey(toBuffer(e.owner.ethPrivKey))
)

export const attesterWallet: Promise<Wallet.Wallet> = envPr.then(e =>
  Wallet.fromPrivateKey(toBuffer(e.owner.ethPrivKey))
)

export const requesterWallet: Promise<Wallet.Wallet> = envPr.then(e =>
  Wallet.fromPrivateKey(toBuffer(e.owner.ethPrivKey))
)
