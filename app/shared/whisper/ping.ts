import * as newrelic from 'newrelic'
import * as Raven from 'raven'
import {env} from '@shared/environment'
import {serverLogger} from '@shared/logger'
import * as Shh from 'web3-shh'
import * as Web3 from 'web3'

import {Sequelize as S} from 'sequelize-typescript'
import {Op} from 'sequelize'
import {WhisperFilters, Ping} from '@shared/models'

import {bufferToHex} from 'ethereumjs-util'
import {shh} from '@shared/whisper'
import {EMsgTypes, IPing, IPong, IPingPong} from '@shared/whisper/msgTypes'

// Outgoing
export const sendPings = async (wf: WhisperFilters, web3: Web3) => {
  const existing = Ping.findOne({
    where: {
      created: {
        [Op.gte]: S.literal(
          `CURRENT_TIMESTAMP - INTERVAL '${env.whisper.ping.interval}`
        ),
      },
    },
  })
  if (existing) return
  sendPing(wf, web3)
}

const symkeyId = shh.generateSymKeyFromPassword(env.whisper.ping.password)

export const sendPing = async (wf: WhisperFilters, web3: Web3) => {
  try {
    // Generate symkey from password

    const ping = await Ping.create()

    const outcome = await shh.post({
      ttl: 10,
      topic: bufferToHex(wf.topic),
      powTarget: 2.01,
      powTime: 2,
      payload: web3.fromAscii(
        JSON.stringify({
          messageType: EMsgTypes.ping,
          session: ping.id,
        })
      ),
      symKeyID: await symkeyId,
    })
    if (!outcome) {
      throw new Error('Failed to broadcast message')
    }
  } catch (err) {
    throw err
  }
}

interface IPingTable {
  [key: string]: Ping
}

// Incoming
export const handlePongMessages = async (wf: WhisperFilters, web3: Web3) => {
  let wPings = await shh.getFilterMessages(wf.filterId)
  let pings = await Ping.findAll({
    where: {
      answered: false,
    },
  })
  const pingTable: IPingTable = {}
  pings.forEach((ping: Ping) => {
    pingTable[ping.id] = ping
  })
  wPings.map(async (wPing: Shh.Message) => {
    let body: IPingPong = JSON.parse(web3.toAscii(wPing.payload))
    if (body.messageType === EMsgTypes.pong) {
      await handlePong(body, wf, pingTable)
    } else if (body.messageType === EMsgTypes.ping) {
      await maybeReplyToPing(body, wf, web3)
    }
  })
  const answeredPingsCount = parseInt(
    ((await Ping.findAll({
      where: {
        created: {
          [Op.gte]: S.literal(
            `CURRENT_TIMESTAMP - INTERVAL '${env.whisper.ping.alertInterval}'`
          ),
        },
      },
      attributes: [[S.fn('COUNT', S.col('*')), 'count']],
    })) as any)[0].dataValues.count
  )

  if (answeredPingsCount === 0) {
    alertNoPongs()
  }
}

const alertNoPongs = () => {
  const alertMessage = `No whisper pongs in last ${env.whisper.ping.alertInterval}`
  newrelic.recordCustomEvent('', {
    Action: 'NoWhisperPongs',
    AppID: env.appId,
    Interval: env.whisper.ping.alertInterval,
  })
  Raven.captureException(new Error(alertMessage), {
    tags: {logger: 'whisper'},
  })
  serverLogger.error(alertMessage)
}

export const handlePong = (
  body: IPong,
  wf: WhisperFilters,
  pingTable: IPingTable
) => {
  let correspondingPing = pingTable[body.session]
  if (correspondingPing) {
    correspondingPing.update({
      answered: true,
    })
  }
}

export const maybeReplyToPing = async (
  body: IPing,
  wf: WhisperFilters,
  web3: Web3
) => {
  // Don't reply to your own messages
  let ping = await Ping.findOne({where: {id: body.session}})
  if (ping) return

  if (env.logs.whisper.pings)
    serverLogger.debug(`Replying with pong to ping ${body.session}`)

  await shh.post({
    ttl: 10,
    topic: bufferToHex(wf.topic),
    powTarget: 2.01,
    powTime: 2,
    payload: web3.fromAscii(
      JSON.stringify({
        messageType: EMsgTypes.pong,
        session: body.session,
      })
    ),
    symKeyID: await symkeyId,
  })
}
