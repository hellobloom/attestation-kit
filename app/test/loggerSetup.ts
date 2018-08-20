/**
 *  Mock out our backend logger so our tests stay quiet
 */
jest.mock('@shared/logger', () => {
  const winston = require('winston')

  // Construct a logger with zero transports which means it doesn't print anything
  const silentLogger = new winston.Logger({transports: []})

  return {
    pollTrackerLogger: silentLogger,
    delayedJobLogger: silentLogger,
    serverLogger: silentLogger,
  }
})
