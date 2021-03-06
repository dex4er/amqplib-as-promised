import amqplib from 'amqplib'
import { EventEmitter } from 'events'

import { Channel } from './channel'

export class Connection extends EventEmitter {
  protected connection?: amqplib.Connection

  constructor (protected url: string, protected options?: amqplib.Options.Connect) {
    super()
  }

  async init (): Promise<void> {
    this.connection = await amqplib.connect(this.url, this.options)

    this.connection.once('close', () => {
      this.emit('close')

      delete this.connection
    })

    this.connection.on('error', (e) => this.emit('error', e))
  }

  async createChannel (): Promise<Channel> {
    if (!this.connection) {
      throw new Error('Cannot create channel - connection wrapper is not initialized.')
    }
    const nativeChannel = await this.connection.createChannel()
    return new Channel(nativeChannel, this.connection)
  }

  async close (): Promise<void> {
    if (this.connection) {
      await this.connection.close()
    }
  }

  async waitForClose (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.connection) {
        reject(new Error('Cannot wait for connection close - connection not initialized.'))
      } else {
        this.connection.once('close', () => {
          resolve()
        })
      }
    })
  }
}
