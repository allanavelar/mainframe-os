// @flow

import { dirname } from 'path'
import { ensureDir } from 'fs-extra'
import leveldown from 'leveldown'
import levelAdapter from 'pouchdb-adapter-leveldb'
import * as RxDB from 'rxdb'

import createAppsCollection from './collections/apps'
import createAppVersionsCollection from './collections/appVersions'
import createContactRequestsCollection from './collections/contactRequests'
import createContactsCollection from './collections/contacts'
import createEthWalletsHDCollection from './collections/ethWalletsHD'
import createEthWalletsLedgerCollection from './collections/ethWalletsLedger'
import createOwnAppsCollection from './collections/ownApps'
import createOwnDevelopersCollection from './collections/ownDevelopers'
import createPeersCollection from './collections/peers'
import createUserAppSettingsCollection from './collections/userAppSettings'
import createUsersCollection from './collections/users'
import type { DB, DBParams } from './types'

RxDB.plugin(levelAdapter)

export const createDB = async (params: DBParams): Promise<DB> => {
  // Uncomment the following line to reset the DB in development
  // await RxDB.removeDatabase(params.location, leveldown)

  await ensureDir(dirname(params.location))

  const db = await RxDB.create({
    name: params.location,
    adapter: leveldown,
    password: params.password,
    multiInstance: false,
  })

  const collectionParams = { db, logger: params.logger }
  await Promise.all([
    createAppsCollection(collectionParams),
    createAppVersionsCollection(collectionParams),
    createContactRequestsCollection(collectionParams),
    createContactsCollection(collectionParams),
    createEthWalletsHDCollection(collectionParams),
    createEthWalletsLedgerCollection(collectionParams),
    createOwnAppsCollection(collectionParams),
    createOwnDevelopersCollection(collectionParams),
    createPeersCollection(collectionParams),
    createUserAppSettingsCollection(collectionParams),
    createUsersCollection(collectionParams),
  ])

  return db
}
