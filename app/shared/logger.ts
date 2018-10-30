import * as winston from 'winston'
import {env} from '@shared/environment'

const consoleLogger = new winston.Logger({
  timestamp: () => Date.now(),
  transports: [new winston.transports.Console({level: env.logs.level || 'info'})],
})

export {
  consoleLogger as pollTrackerLogger,
  consoleLogger as delayedJobLogger,
  consoleLogger as serverLogger,
}
