import {log} from '@shared/logger'
import * as Web3 from 'web3'
import * as Sentry from '@sentry/node'
import {env, getProvider} from '@shared/environment'
import {
  resetShh,
  newBroadcastSession,
  TWhisperEntity,
  getTopic,
} from '@shared/whisper'
import {
  attesterWallet,
  requesterWallet,
} from '@shared/attestations/attestationWallets'
import {handleMessages} from '@shared/whisper/msgHandler'
import {listenForSolicitations} from '@shared/whisper/attesterActions'
import {sendPings, handlePongMessages} from '@shared/whisper/ping'
import {WhisperFilters} from '@shared/models'

let envPr = env()

void envPr.then(async e => {
  Sentry.init({
    dsn: e.sentryDSN,
    environment: e.pipelineStage,
    release: e.sourceVersion,
  })

  const web3 = new Web3(
    new Web3.providers.HttpProvider(await getProvider('mainnet'))
  )
  const toTopic = (ascii: string) => web3.sha3(ascii).slice(0, 10)

  const password = e.whisper.password

  const getPingFilter = async () => {
    if (e.logs.whisper.pings) {
      log('Ping filter needs refreshing, getting a new one')
    }
    let existing = await WhisperFilters.findOne({
      where: {entity: 'ping'},
      logging: e.logs.whisper.sql,
    })
    return (
      existing ||
      newBroadcastSession(
        await toTopic(await getTopic('ping')),
        e.whisper.ping.password,
        'ping'
      )
    )
  }

  const main = async () => {
    try {
      if (e.whisper.ping.enabled) {
        try {
          const wf = await getPingFilter()
          if (wf) {
            console.log('Working with WhisperFilter', wf.filterId)
            try {
              await sendPings(wf, web3)
            } catch (err) {
              console.log('Unhandled error sending whisper pings', err)
            }
            try {
              await handlePongMessages(wf, web3)
            } catch (err) {
              console.log('Unhandled error handling whisper pongs', err)
            }
          } else {
            console.log('pingFilterPromise returned nothing')
          }
        } catch (err) {
          console.log('Unhandled error handling ping (general)', err)
        }
      }

      if (e.attester_rewards) {
        Object.keys(e.attester_rewards).forEach(
          async (topic_name: TWhisperEntity) => {
            let hashed_topic = await toTopic(await getTopic(topic_name))
            await listenForSolicitations(hashed_topic, password, topic_name)
            await handleMessages(topic_name, await attesterWallet)
          }
        )
      }

      await handleMessages('requester', await requesterWallet)
    } catch (error) {
      log(error, {full: true, tags: {logger: 'whisper'}})
      log({name: 'WhisperError', event: {Entity: 'Attester'}}, {event: true})
      log(`Encountered error in Whisper worker! ${error}`)
      console.log(error, error.stack)
      await resetShh()
    }

    setTimeout(main, e.whisper.pollInterval)
  }

  main()
    .then(() => log('Finished Whisper worker!'))
    .catch(error =>
      log(`Whisper worker failed with error!: ${JSON.stringify(error)}`, {
        level: 'warn',
      })
    )
})
