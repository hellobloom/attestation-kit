import * as Web3 from 'web3'

import {privateEngine, walletFor} from '@shared/ethereum/customWeb3Provider'
import {env} from '@shared/environment'

let envPr = env()

const engine = envPr.then(e => privateEngine(e.owner.ethPrivKey))
const wallet = envPr.then(e => walletFor(e.owner.ethPrivKey))

export const address = wallet.then(w => w.getAddressString())
export const web3 = engine.then(eng => new Web3(eng))
