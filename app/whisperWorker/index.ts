import * as newrelic from 'newrelic'
import * as Web3 from 'web3'
import * as Raven from 'raven'
// import BigNumber from 'bignumber.js'
import {env} from '@shared/environment'
import {resetShh} from '@shared/attestations/whisper'
import {
  attesterWallet,
  requesterWallet,
} from '@shared/attestations/attestationWallets'

import {serverLogger} from '@shared/logger'

import {
  handleMessages,
  AttestationTypeToEntity,
} from '@shared/attestations/whisperMessageHandler'

import {listenForSolicitations} from '@shared/attestations/whisperAttesterActions'

Raven.config(env.sentryDSN, {environment: env.nodeEnv}).install()

const web3 = new Web3(new Web3.providers.HttpProvider(env.web3Provider))
const toTopic = (ascii: string) => web3.sha3(ascii).slice(0, 10)

const password = env.whisper.password

const main = async () => {
  try {
    if (env.attester_rewards) {
      Object.keys(env.attester_rewards).forEach(async (topic_name: string) => {
        let hashed_topic = toTopic(env.whisper.topics[topic_name])
        let entity: string = AttestationTypeToEntity[topic_name]
        await listenForSolicitations(hashed_topic, password, entity)
        await handleMessages(entity as string, attesterWallet)
      })
    }

    await handleMessages(AttestationTypeToEntity['requester'], requesterWallet)
  } catch (error) {
    Raven.captureException(error, {
      tags: {logger: 'whisper'},
    })
    newrelic.recordCustomEvent('WhisperError', {Entity: 'Attester'})
    serverLogger.info(`Encountered error in Whisper worker! ${error}`)
    console.log(error, error.stack)
    resetShh()
  }
  // setTimeout(main, 500) // twice per second
  setTimeout(main, env.whisperPollInterval || 5000) // once per five seconds
}

main()
  .then(() => serverLogger.info('Finished Whisper worker!'))
  .catch(error => serverLogger.warn('Whisper worker failed with error!', error))
