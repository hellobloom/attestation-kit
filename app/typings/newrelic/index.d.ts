declare module 'newrelic' {
  export interface Rules {
    name: Pattern[]
    ignore: string[]
  }

  export interface eventAttributes {
    [key: string]: string | number | boolean
  }

  export interface Pattern {
    pattern: string
    name: string
    terminate_chain?: boolean
    replace_all?: boolean
    precedence?: boolean
  }

  export interface Options {
    collectPendingData: boolean
    timeout: number
  }

  export interface MetricValue {
    count: number
    total: number
    min: number
    max: number
    sumOfSquares: number
  }

  export interface newrelic {
    setTransactionName(name: string): void
    setControllerName(name: string, action: {}): void
    setControllerName(name: string): void
    createWebTransaction(url: string, handler: Function): void
    createBackgroundTransaction(
      name: string,
      group: string | null,
      handler: Function
    ): void
    createBackgroundTransaction(name: string, handler: Function): void
    endTransaction(): void
    createTracer(name: string, callback: Function): void
    recordMetric(name: string, value: number | MetricValue): void
    incrementMetric(name: string, amount?: number): void
    recordCustomEvent(eventType: string, attributes: {}): void
    addCustomParameter(name: string, value: string | number): void
    addCustomParameters(params: {}): void
    getBrowserTimingHeader(): string
    setIgnoreTransaction(ignored: boolean): void
    noticeError(error: Error, customParameters: {}): void
    noticeError(error: Error): void
    shutdown(options: Options, callback: Function): void
    rules: Rules
    addNamingRule(pattern: Pattern[], name: string): void
    addIgnoringRule(pattern: string[]): void
  }

  export function setTransactionName(name: string): void
  export function setControllerName(name: string, action: {}): void
  export function setControllerName(name: string): void
  export function createWebTransaction(url: string, handler: Function): void
  export function createBackgroundTransaction(
    name: string,
    group: string | null,
    handler: Function
  ): void
  export function createBackgroundTransaction(name: string, handler: Function): void
  export function endTransaction(): void
  export function createTracer(name: string, callback: Function): void
  export function recordMetric(name: string, value: number | MetricValue): void
  export function incrementMetric(name: string, amount?: number): void
  export function recordCustomEvent(
    eventType: string,
    attributes: eventAttributes
  ): void
  export function addCustomParameter(name: string, value: string | number): void
  export function addCustomParameters(params: {}): void
  export function getBrowserTimingHeader(): string
  export function setIgnoreTransaction(ignored: boolean): void
  export function noticeError(error: Error, customParameters: {}): void
  export function noticeError(error: Error): void
  export function shutdown(options: Options, callback: Function): void
  export var rules: Rules
  export function addNamingRule(pattern: Pattern[], name: string): void
  export function addIgnoringRule(pattern: string[]): void
}
