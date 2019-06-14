// @flow

import { createReadStream } from 'fs'
import { Readable } from 'stream'
import type { ListResult } from '@erebos/api-bzz-base'
import getStream from 'get-stream'
import {
  LOCAL_ID_SCHEMA,
  type BlockchainEthSendParams,
  type ContactsGetUserContactsResult,
  type EthUnsubscribeParams,
  type WalletGetEthWalletsResult,
} from '@mainframe/client'
import { dialog } from 'electron'
import { fromEvent, type Subscription as RxSubscription } from 'rxjs'
import * as mime from 'mime'
import nanoid from 'nanoid'

import {
  RPC_ETHEREUM_ACCOUNTS_CHANGED,
  RPC_ETHEREUM_NETWORK_CHANGED,
} from '../../constants'

import type { AppContext } from '../context/app'
import { withPermission } from '../permissions'
import {
  getStorageManifestHash,
  downloadStream,
  uploadStream,
} from '../storage'

const STORAGE_KEY_PARAM = { type: 'string', pattern: /^([A-Za-z0-9_. =+-]+?)$/ }

const sharedMethods = {
  ethereum_send: async (
    ctx: AppContext,
    params: EthereumSendParams,
  ): Promise<any> => {
    return await ctx.session.user.getEth().send(params.method, params.params)
  },

  wallet_getEthAccounts: async (ctx: AppContext): Promise<Array<string>> => {
    const accounts = await ctx.session.user.getEthAccounts()
    const { defaultEthAccount } = ctx.session.settings
    if (defaultEthAccount != null) {
      // Move default account to top
      const accountIndex = accounts.indexOf(defaultEthAccount)
      if (accountIndex !== -1) {
        accounts.splice(accountIndex, 1)
        accounts.unshift(defaultEthAccount)
      }
    }
    return accounts
  },
}

export const sandboxed = {
  ...sharedMethods,

  ethereum_subscribe: async (
    ctx: AppContext,
    params: EthereumSubscribeParams,
  ): Promise<{ id: string }> => {
    const provider = ctx.session.user.getEth().web3Provider
    if (provider.subscribe != null && provider.on != null) {
      const subID = await provider.subscribe(
        'eth_subscribe',
        params.params[0],
        params.params,
      )
      const subscription = fromEvent(provider, subID).subscribe(msg => {
        if (msg.subscription === subID) {
          ctx.notifySandboxed('eth_subscription', subID, msg)
        }
      })
      ctx.addSubscription(subID, subscription)
      return { id: subID }
    }
    throw new Error('Subscriptions not supported')
  },

  ethereum_subscribeAccountsChanged: async (
    ctx: AppContext,
  ): Promise<{ id: string }> => {
    const id = nanoid()
    const subscription = fromEvent(
      ctx.session.user.getEth(),
      'accountsChanged',
    ).subscribe(event => {
      ctx.notifySandboxed(RPC_ETHEREUM_ACCOUNTS_CHANGED, id, event)
    })
    ctx.addSubscription(id, subscription)
    return { id }
  },

  ethereum_subscribeNetworkChanged: async (
    ctx: AppContext,
  ): Promise<{ id: string }> => {
    const id = nanoid()
    const subscription = fromEvent(
      ctx.session.user.getEth(),
      'networkChanged',
    ).subscribe(event => {
      ctx.notifySandboxed(RPC_ETHEREUM_NETWORK_CHANGED, id, event)
    })
    ctx.addSubscription(id, subscription)
    return { id }
  },

  ethereum_unsubscribe: async (
    ctx: AppContext,
    params: { id: string },
  ): Promise<void> => {
    const provider = ctx.session.user.getEth().web3Provider
    if (provider.unsubscribe != null) {
      await provider.unsubscribe(params.id)
    }
    ctx.removeSubscription(params.id)
  },

  // Blockchain

  // blockchain_ethSubscribe: async (
  //   ctx: AppContext,
  //   params: BlockchainEthSendParams,
  // ): Promise<Object> => {
  //   const { subscription, id } = await ctx.client.blockchain.ethSubscribe(
  //     params,
  //   )
  //   const sub = new EthBlockchainSubscription(id)
  //   sub.data = subscription.subscribe(msg => {
  //     ctx.notifySandboxed(sub.id, msg.result)
  //   })
  //   ctx.setSubscription(sub)
  //   return sub.id
  // },

  // blockchain_ethUnsubscribe: async (
  //   ctx: AppContext,
  //   params: EthUnsubscribeParams,
  // ): Promise<Object> => {
  //   return ctx.client.blockchain.ethUnsubscribe(params)
  // },

  // blockchain_subscribeNetworkChanged: async (
  //   ctx: AppContext,
  // ): Promise<Object> => {
  //   const subscription = await ctx.client.blockchain.subscribeNetworkChanged()
  //   const sub = new EthNetworkSubscription()
  //   sub.data = subscription.subscribe(msg => {
  //     ctx.notifySandboxed(sub.id, msg)
  //   })
  //   ctx.setSubscription(sub)
  //   return { id: sub.id }
  // },
  //
  // wallet_subEthAccountsChanged: async (ctx: AppContext): Promise<Object> => {
  //   const subscription = await ctx.client.wallet.subscribeEthAccountsChanged()
  //   const sub = new EthWalletSubscription()
  //   sub.data = subscription.subscribe(msg => {
  //     ctx.notifySandboxed(sub.id, msg)
  //   })
  //   ctx.setSubscription(sub)
  //   return { id: sub.id }
  // },

  // Wallet

  wallet_signEthTx: withPermission(
    'BLOCKCHAIN_SEND',
    (ctx: AppContext, params: any) => ctx.client.wallet.signTransaction(params),
  ),

  wallet_signEthData: withPermission(
    'BLOCKCHAIN_SIGN',
    (ctx: AppContext, params: any) => ctx.client.wallet.sign(params),
  ),

  // Comms

  // comms_publish: withPermission(
  //   'COMMS_CONTACT',
  //   async (
  //     ctx: AppContext,
  //     params: { contactID: string, key: string, value: Object },
  //   ): Promise<void> => {
  //     const appID = ctx.appSession.app.appID
  //     const userID = ctx.appSession.user.id
  //     return ctx.client.comms.publish({ ...params, appID, userID })
  //   },
  // ),

  // comms_subscribe: withPermission(
  //   'COMMS_CONTACT',
  //   async (
  //     ctx: AppContext,
  //     params: { contactID: string, key: string },
  //   ): Promise<string> => {
  //     const appID = ctx.appSession.app.appID
  //     const userID = ctx.appSession.user.id
  //     const subscription = await ctx.client.comms.subscribe({
  //       ...params,
  //       appID,
  //       userID,
  //     })
  //     const sub = new CommsSubscription()
  //     sub.data = subscription.subscribe(msg => {
  //       ctx.notifySandboxed(sub.id, msg)
  //     })
  //     ctx.setSubscription(sub)
  //     return sub.id
  //   },
  // ),
  //
  // comms_getSubscribable: withPermission(
  //   'COMMS_CONTACT',
  //   async (
  //     ctx: AppContext,
  //     params: { contactID: string },
  //   ): Promise<Array<string>> => {
  //     const appID = ctx.appSession.app.appID
  //     const userID = ctx.appSession.user.id
  //     return ctx.client.comms.getSubscribable({ ...params, appID, userID })
  //   },
  // ),

  // Contacts

  contacts_select: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext, params: { multi?: boolean }) => {
      const res = await ctx.trustedRPC.request('user_request', {
        key: 'CONTACTS_SELECT',
        params: { CONTACTS_SELECT: params },
      })
      if (!res || !res.granted || !res.data || !res.data.selectedContactIDs) {
        return { contacts: [] }
      }
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactIDs = res.data.selectedContactIDs
      const contactsToApprove = contactIDs.map(id => ({
        localID: id,
        publicDataOnly: true, // TODO allow user to set only public data
      }))
      const {
        approvedContacts,
      } = await ctx.client.contacts.approveContactsForApp({
        appID,
        userID,
        contactsToApprove,
      })
      const ids = approvedContacts.map(c => c.id)

      const contactsRes = await ctx.client.contacts.getAppUserContacts({
        appID,
        userID,
        contactIDs: ids,
      })
      return contactsRes.contacts
    },
  ),

  contacts_getData: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext, params: { contactIDs: Array<string> }) => {
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactsRes = await ctx.client.contacts.getAppUserContacts({
        appID,
        userID,
        contactIDs: params.contactIDs,
      })
      return contactsRes.contacts
    },
  ),

  contacts_getApproved: withPermission(
    'CONTACTS_READ',
    async (ctx: AppContext) => {
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      const contactsRes = await ctx.client.contacts.getAppApprovedContacts({
        appID,
        userID,
      })
      return contactsRes.contacts
    },
  ),

  storage_promptUpload: {
    params: {
      key: STORAGE_KEY_PARAM,
    },
    handler: (ctx: AppContext, params: { key: string }): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        dialog.showOpenDialog(
          ctx.window,
          { title: 'Select file to upload', buttonLabel: 'Upload' },
          async filePaths => {
            if (filePaths.length === 0) {
              // No file selected
              resolve(false)
            } else {
              try {
                const filePath = filePaths[0]
                await uploadStream(ctx, {
                  contentType: mime.getType(filePath),
                  key: params.key,
                  stream: createReadStream(filePath),
                })
                resolve(true)
              } catch (error) {
                reject(new Error('Failed to access storage'))
              }
            }
          },
        )
      })
    },
  },

  storage_list: {
    handler: async (
      ctx: AppContext,
    ): Promise<Array<{ contentType: string, key: string }>> => {
      try {
        const { manifestHash } = await getStorageManifestHash(ctx)
        const list: ListResult = await ctx.bzz.list(manifestHash)
        return list.entries == null
          ? []
          : list.entries.map(meta => {
              return { contentType: meta.contentType, key: meta.path }
            })
      } catch (error) {
        throw new Error('Failed to access storage')
      }
    },
  },

  storage_set: {
    params: {
      key: STORAGE_KEY_PARAM,
      data: 'string',
    },
    handler: async (
      ctx: AppContext,
      params: {
        key: string,
        data: string,
      },
    ): Promise<void> => {
      try {
        const stream = new Readable()
        stream.push(params.data)
        stream.push(null)
        await uploadStream(ctx, {
          contentType: 'text/plain',
          key: params.key,
          stream,
        })
      } catch (error) {
        throw new Error('Failed to access storage')
      }
    },
  },

  storage_get: {
    params: {
      key: STORAGE_KEY_PARAM,
    },
    handler: async (
      ctx: AppContext,
      params: { key: string },
    ): Promise<?string> => {
      try {
        const stream = await downloadStream(ctx, params.key)
        if (stream !== null) {
          return await getStream(stream)
        }
      } catch (error) {
        throw new Error('Failed to access storage')
      }
    },
  },
}

export const trusted = {
  ...sharedMethods,

  sub_createPermissionDenied: (ctx: AppContext): { id: string } => ({
    id: ctx.createPermissionDeniedSubscription(),
  }),

  sub_unsubscribe: {
    params: {
      id: LOCAL_ID_SCHEMA,
    },
    handler: (ctx: AppContext, params: { id: string }): void => {
      ctx.removeSubscription(params.id)
    },
  },

  blockchain_subscribeNetworkChanged: async (
    ctx: AppContext,
  ): Promise<Object> => {
    const subscription = await ctx.client.blockchain.subscribeNetworkChanged()
    const sub = new EthNetworkSubscription()
    sub.data = subscription.subscribe(msg => {
      ctx.notifyTrusted(sub.id, msg)
    })
    ctx.setSubscription(sub)
    return { id: sub.id }
  },

  wallet_getUserEthWallets: async (
    ctx: AppContext,
  ): Promise<WalletGetEthWalletsResult> => {
    return ctx.client.wallet.getUserEthWallets({
      userID: ctx.appSession.user.localID,
    })
  },

  wallet_selectDefault: async (
    ctx: AppContext,
  ): Promise<{ address: ?string }> => {
    const res = await ctx.trustedRPC.request('user_request', {
      key: 'WALLET_ACCOUNT_SELECT',
      params: {},
    })
    let address
    if (res.data && res.data.address) {
      address = res.data.address
      ctx.appSession.defaultEthAccount = res.data.address
      const userID = ctx.appSession.user.id
      const appID = ctx.appSession.app.appID
      await ctx.client.app.setUserDefaultWallet({
        userID,
        appID,
        address,
      })
    }
    return { address }
  },

  wallet_subEthAccountsChanged: async (ctx: AppContext): Promise<Object> => {
    const subscription = await ctx.client.wallet.subscribeEthAccountsChanged()
    const sub = new EthWalletSubscription()
    sub.data = subscription.subscribe(msg => {
      ctx.notifyTrusted(sub.id, msg)
    })
    ctx.setSubscription(sub)
    return { id: sub.id }
  },

  contacts_getUserContacts: (
    ctx: AppContext,
    params: { userID: string },
  ): Promise<ContactsGetUserContactsResult> => {
    return ctx.client.contacts.getUserContacts(params)
  },
}
