import * as Web3 from 'web3'

import {privateEngine, walletFor} from '@shared/ethereum/customWeb3Provider'
import {env} from '@shared/environment'

let envPr = env()

const engine = envPr.then(e => privateEngine(e.owner.key))
const wallet = envPr.then(e => walletFor(e.owner.key))

export const address = wallet.then(w => w.getAddressString())
export const web3 = engine.then(eng => new Web3(eng))
