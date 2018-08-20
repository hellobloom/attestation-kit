import * as Web3 from 'web3'

import {privateEngine, walletFor} from '@shared/ethereum/customWeb3Provider'
import {env} from '@shared/environment'

const engine = privateEngine(env.owner.ethPrivKey)
const wallet = walletFor(env.owner.ethPrivKey)

export const address = wallet.getAddressString()
export const web3 = new Web3(engine)
