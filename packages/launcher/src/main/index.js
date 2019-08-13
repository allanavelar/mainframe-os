// @flow

// Needed to fix issue with Ledger: https://github.com/LedgerHQ/ledgerjs/issues/211
import '@babel/polyfill'

import { app, BrowserWindow, ipcMain } from 'electron'
import { is } from 'electron-util'

import './menu'
import { SystemContext } from './context/system'
import { Environment } from './environment'
import { createLogger } from './logger'

const { MAINFRAME_ENV, NODE_ENV } = process.env

const ENV_NAME = MAINFRAME_ENV || 'local-test'
let ENV_TYPE = is.development ? 'development' : 'production'
if (
  NODE_ENV === 'development' ||
  NODE_ENV === 'testing' ||
  NODE_ENV === 'production'
) {
  ENV_TYPE = NODE_ENV
}

if (ENV_TYPE === 'production') {
  if (app.requestSingleInstanceLock()) {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      // TODO: update logic for new windows management system
      // if (launcherWindow) {
      //   if (launcherWindow.isMinimized()) launcherWindow.restore()
      //   launcherWindow.focus()
      // }
    })
  } else {
    app.exit()
  }
}

const env = Environment.get(ENV_NAME, ENV_TYPE)
const logger = createLogger(env)
const system = new SystemContext({ env, logger })

// App Lifecycle

app.on('ready', async () => {
  try {
    await system.initialize()
    system.openLauncher(system.defaultUser)
  } catch (err) {
    logger.log({
      level: 'error',
      message: 'Could not start system',
      error: err.toString(),
    })
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  // TODO: focus on most relevant window
})

// Window lifecycle events

ipcMain.on('window-exception', (event, error) => {
  const ctx =
    system.getLauncherContext(event.sender) ||
    system.getAppContext(event.sender)
  const windowLogger = ctx ? ctx.logger : logger
  windowLogger.error(`Window exception: ${error.message}`)
})

ipcMain.on('window-opened', async event => {
  const launcherContext = system.getLauncherContext(event.sender)
  if (launcherContext != null) {
    event.sender.send('window-start', {
      type: 'launcher',
      initialProps: {
        route: await launcherContext.getInitialRoute(),
      },
    })
    return
  }

  const appContext = system.getAppContext(event.sender)
  if (appContext != null) {
    event.sender.send('window-start', {
      type: 'app',
      initialProps: {
        session: await appContext.session.toAppWindowSession(),
      },
    })
    return
  }

  logger.error('Context not found for Window opened')
})

ipcMain.on('window-ready', event => {
  BrowserWindow.fromWebContents(event.sender).show()
})
