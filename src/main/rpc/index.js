// @flow

import createHandler, { type Methods } from '@mainframe/rpc-handler'
import { ipcMain, type WebContents } from 'electron'

import {
  APP_SANDBOXED_CHANNEL,
  APP_TRUSTED_CHANNEL,
  LAUNCHER_CHANNEL,
} from '../../constants'

import type { SystemContext } from '../context/system'
import type { Logger } from '../logger'

import { sandboxed as sandboxedMethods, trusted as trustedMethods } from './app'
import launcherMethods from './launcher'

type Notification = {
  method: string,
  params: Object,
}

type ChannelParams = {
  logger: Logger,
  name: string,
  methods: Methods,
  getContext: (sender: WebContents) => *,
}

const createChannel = (params: ChannelParams) => {
  const onNotification = (ctx: *, notif: Notification) => {
    if (notif.method === 'log') {
      params.logger.log(notif.params)
    } else {
      params.logger.error(
        `Unsupported notification from window: ${notif.method}`,
      )
    }
  }

  const handleMessage = createHandler({
    methods: params.methods,
    onNotification,
  })

  ipcMain.on(params.name, async (event, incoming) => {
    try {
      const ctx = params.getContext(event.sender)
      if (ctx == null) {
        throw new Error('Could not get context')
      }

      params.logger.log({
        level: 'silly',
        message: 'RPC request incoming',
        channel: params.name,
        incoming,
      })

      const outgoing = await handleMessage(ctx, incoming)
      if (outgoing != null) {
        params.logger.log({
          level: 'silly',
          message: 'RPC response outgoing',
          channel: params.name,
          incoming,
          outgoing,
        })
        event.sender.send(params.name, outgoing)
      }
    } catch (err) {
      params.logger.log({
        level: 'error',
        message: 'RPC request failed',
        channel: params.name,
        incoming,
        error: err.toString(),
      })
    }
  })
}

export const createChannels = (system: SystemContext) => {
  const appLogger = system.logger.child({ context: 'rpc/app' })
  const getAppContext = system.getAppContext.bind(system)

  createChannel({
    logger: appLogger,
    name: APP_SANDBOXED_CHANNEL,
    methods: sandboxedMethods,
    getContext: getAppContext,
  })

  createChannel({
    logger: appLogger,
    name: APP_TRUSTED_CHANNEL,
    methods: trustedMethods,
    getContext: getAppContext,
  })

  createChannel({
    logger: system.logger.child({ context: 'rpc/launcher' }),
    name: LAUNCHER_CHANNEL,
    methods: launcherMethods,
    getContext: system.getLauncherContext.bind(system),
  })
}
