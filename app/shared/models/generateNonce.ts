import * as crypto from 'crypto'
import * as BigNumber from 'bignumber.js'

export const generateNonce = () => {
  var bn = new BigNumber.BigNumber(crypto.randomBytes(32).toString('hex'), 16)
  if (bn.e !== 76) {
    let diff = bn.e - 76
    bn = bn.times(10 ** -diff)
  }
  return bn
}
