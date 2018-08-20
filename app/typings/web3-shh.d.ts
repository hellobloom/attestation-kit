declare module 'web3-shh' {
  class Shh {
    public constructor(host: string)

    public newKeyPair(): Promise<Shh.KeyID>
    public addPrivateKey(privateKey: string): Promise<string>
    public deleteKeyPair(id: string): Promise<boolean>
    public getPrivateKey(id: string): Promise<string>
    public getPublicKey(keyPairId: string): Promise<string>
    public post(params: Shh.Post): Promise<boolean>
    public subscribe(
      type: 'messages',
      options: Shh.Subscription
    ): Shh.SubscriptionHandler<Shh.Message>
    public newMessageFilter(options: Shh.Subscription): Promise<string>
    public deleteMessageFilter(id: string): Promise<boolean>
    public getFilterMessages(id: string): Promise<Shh.Message[]>
    public generateSymKeyFromPassword(password: string): string
  }

  namespace Shh {
    type KeyID = string
    interface Message {
      ttl: number
      timestamp: number
      topic: string
      payload: string
      padding: string
      pow: number
      hash: string
      recipientPublicKey: string
    }

    interface Post {
      ttl: number
      topic: string
      payload: string
      symKeyID?: string
      pubKey?: string
      sig?: string
      padding?: number
      powTime?: number
      powTarget?: number
      targetPeer?: number
    }

    interface Subscription {
      symKeyID?: string
      privateKeyID?: string
      sig?: string
      topics?: string[]
      minPow?: number
      allowP2P?: boolean
    }

    interface SubscriptionHandler<T> {
      on(type: 'data', callback: (data: T) => void): void
    }
  }

  export = Shh
}
