import * as express from 'express'
// import * as path from 'path'
import {env} from '@shared/environment'
import * as attCtrl from '@api/controllers/attestation'
import * as reqCtrl from '@api/controllers/request'
import {sha256} from 'ethereumjs-util'
import * as bodyParser from 'body-parser'
import { txMined } from './controllers/webhooks';
import { getProof } from './controllers/merkleProof';

let envPr = env()

const app = express()

interface IRequestWithRawBody extends express.Request {
  rawBody?: Buffer
}
const captureRawBody = (
  req: IRequestWithRawBody,
  res: express.Response,
  buf: Buffer
) => {
  req.rawBody = buf
  return true
}

app.use(
  bodyParser.json({
    type: '*/*',
    verify: captureRawBody,
    limit: '10mb', // https://stackoverflow.com/a/19965089/1165441
  })
)

// kick out unauthenticated requests
app.use(async (req, res, next) => {
  let e = await envPr
  var tokenHash = sha256(req.headers.api_token as string).toString('hex')
  if (tokenHash !== e.apiKey) {
    res.status(403).send('{"success":false,"message":"Unauthorized"}')
  } else {
    next()
  }
})

app.get('/', (req, res) => {
  res.json({success: true, message: 'Successfully authenticated.'})
})

app.get('/api/requests', reqCtrl.show)
app.post('/api/requests', reqCtrl.create)
app.post('/api/v1/requests', reqCtrl.create)
app.post('/api/v2/requests', reqCtrl.create)
app.post('/api/v2/requestsBypass', reqCtrl.createBypass)

app.post('/api/v2/submit-data', attCtrl.receiveSubjectDataLegacy)
app.post('/api/v2/submit-signed-agreement', attCtrl.receiveSignedAgreementLegacy)

app.post('/api/v3/submit-data', attCtrl.receiveSubjectData)
app.post('/api/v3/submit-signed-agreement', attCtrl.receiveSignedAgreement)

app.get('/api/attestations', attCtrl.show)
app.post('/api/attestations', attCtrl.perform)

app.post('/api/webhooks/tx_mined', txMined)
app.post('/api/merkle-proof', getProof)

// IP todo tx_mined and tx_failed?

app.listen(6000, () => console.log('App listening on port 6000'))

export default app
