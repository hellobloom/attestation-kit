import {WhisperFilters, Ping} from '@shared/models'
import {Sequelize as S} from 'sequelize-typescript'
import {bufferToHex} from 'ethereumjs-util'
import * as Shh from 'web3-shh'
import {Op} from 'sequelize'
import * as Web3 from 'web3'
import {env} from '@shared/environment'
import {serverLogger} from '@shared/logger'
import {shh} from '@shared/whisper'
import {EMsgTypes} from '@shared/whisper/msgTypes'

export const sendPings = async (wf: WhisperFilters, web3: Web3) => {
  const existing = Ping.findOne({
    where: {
      created: {
        [Op.gte]: S.literal(`CURRENT_TIMESTAMP - INTERVAL '5 minutes'`),
      },
    },
  })
  if (existing) return
  sendPing(wf, web3)
}

export const sendPongs = async (wf: WhisperFilters, web3: Web3) => {
  const symkeyId = await shh.generateSymKeyFromPassword(env.whisper.ping.password)

  let wPings = await shh.getFilterMessages(wf.filterId)
  wPings.forEach(async (wPing: Shh.Message) => {
    let body = JSON.parse(web3.toAscii(wPing.payload))
    if (body.messageType == 'ping') {
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
        symKeyID: symkeyId,
      })
    }
  })
}

export const sendPing = async (wf: WhisperFilters, web3: Web3) => {
  try {
    // Generate symkey from password
    const symkeyId = await shh.generateSymKeyFromPassword(env.whisper.ping.password)

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
      symKeyID: symkeyId,
    })
    if (!outcome) {
      throw new Error('Failed to broadcast message')
    }
  } catch (err) {
    throw err
  }
}
