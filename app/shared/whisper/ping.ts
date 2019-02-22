import {env} from '@shared/environment'
import {log} from '@shared/logger'
import * as Shh from 'web3-shh'
import * as Web3 from 'web3'

import {Sequelize as S} from 'sequelize-typescript'
import {Op} from 'sequelize'
import {WhisperFilters, Ping} from '@shared/models'

import {bufferToHex} from 'ethereumjs-util'
import {shh} from '@shared/whisper'
import {EMsgTypes, IPing, IPong, IPingPong} from '@shared/whisper/msgTypes'

let envPr = env()

// Outgoing
const symkeyId = envPr.then(e =>
  shh.generateSymKeyFromPassword(e.whisper.ping.password)
)

export const handlePong = async (
  body: IPong,
  wf: WhisperFilters,
  pingTable: IPingTable
) => {
  let e = await envPr
  if (e.logs.whisper.pings) log(`Handling pong: ${JSON.stringify(body)}`)
  let correspondingPing = pingTable[body.session]
  if (correspondingPing) {
    if (e.logs.whisper.pings) {
      log([
        'Handling pong',
        body,
        '; updating corresponding ping:',
        correspondingPing.id,
      ])
    }
    correspondingPing.update(
      {
        answered: true,
      },
      {
        logging: e.logs.whisper.pings,
      }
    )
  }
}

export const maybeReplyToPing = async (
  body: IPing,
  wf: WhisperFilters,
  web3: Web3
) => {
  let e = await envPr
  if (e.logs.whisper.pings) {
    log(`Maybe replying to ping: ${JSON.stringify(body)}`)
  }

  // Don't reply to your own messages
  let ping = await Ping.findOne({
    where: {id: body.session},
    logging: e.logs.whisper.pings,
  })
  if (ping) return

  if (e.logs.whisper.pings) log(`Replying with pong to ping ${body.session}`)

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

export const sendPing = async (wf: WhisperFilters, web3: Web3) => {
  let e = await envPr
  try {
    if (e.logs.whisper.pings) log('Sending ping')
    // Generate symkey from password

    const ping = await Ping.create(
      {},
      {
        logging: e.logs.whisper.pings,
      }
    )

    if (e.logs.whisper.pings) log(`Ping enqueued: ${ping.id}`)

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

export const sendPings = async (wf: WhisperFilters, web3: Web3) => {
  let e = await envPr
  const existing = await Ping.findOne({
    where: {
      created: {
        [Op.gte]: S.literal(
          `CURRENT_TIMESTAMP - INTERVAL '${e.whisper.ping.interval}'`
        ),
      },
    },
    logging: e.logs.whisper.pings,
  })
  if (existing) return
  await sendPing(wf, web3)
}

interface IPingTable {
  [key: string]: Ping
}

const alertWhisperError = async (err: any) => {
  let e = await envPr
  const alertMessage = err || new Error(`Connection to Whisper failed`)
  log(
    {
      name: 'WhisperError',
      event: {
        Action: 'WhisperConnectionFailed',
        AppID: e.appId,
      },
    },
    {event: true}
  )
  log(alertMessage, {
    full: true,
    tags: {logger: 'whisper', appId: e.appId},
  })
}

const alertNoPongs = async () => {
  let e = await envPr
  const alertMessage = `No whisper pongs in last ${e.whisper.ping.alertInterval}`
  log(
    {
      name: 'WhisperError',
      event: {
        Action: 'NoWhisperPongs',
        AppID: e.appId,
        Interval: e.whisper.ping.alertInterval,
      },
    },
    {event: true}
  )
  log(new Error(alertMessage), {
    full: true,
    tags: {logger: 'whisper', appId: e.appId},
  })
}

// Incoming
export const handlePongMessages = async (wf: WhisperFilters, web3: Web3) => {
  let e = await envPr
  var wPings
  try {
    wPings = await shh.getFilterMessages(wf.filterId)
  } catch (err) {
    if (err.message.indexOf('filter not found') !== -1) {
      if (e.logs.whisper.pings) log('Trying to delete old ping WF filter')
      wf.destroy()
    } else {
      void alertWhisperError(err)
    }
    return
  }
  let pings = await Ping.findAll({
    where: {
      answered: false,
    },
    logging: e.logs.whisper.pings,
  })
  const pingTable: IPingTable = {}
  pings.forEach((ping: Ping) => {
    pingTable[ping.id] = ping
  })
  wPings.map(async (wPing: Shh.Message) => {
    if (e.logs.whisper.pings) {
      log(`Processing message on ping channel: ${JSON.stringify(wPing)}`)
    }
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
            `CURRENT_TIMESTAMP - INTERVAL '${e.whisper.ping.alertInterval}'`
          ),
        },
        answered: true,
      },
      attributes: [[S.fn('COUNT', S.col('*')), 'count']],
      logging: e.logs.whisper.pings,
    })) as any)[0].dataValues.count,
    10
  )

  if (answeredPingsCount === 0) {
    void alertNoPongs()
  }
}
