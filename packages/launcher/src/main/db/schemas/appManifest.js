// @flow

import permissionsRequirements, {
  type PermissionsRequirementsData,
} from './appPermissionsRequirements'
import bzzHash from './bzzHash'
import ethAddress from './ethAddress'
import profile, { type GenericProfileData } from './genericProfile'

export type AppManifestData = {|
  publicFeed: string,
  authorFeed: string,
  profile: GenericProfileData,
  version: string,
  contentsHash: string,
  permissions: PermissionsRequirementsData,
|}

export default {
  title: 'application manifest',
  version: 0,
  type: 'object',
  properties: {
    // TODO: does the publicFeed need to be provided in the manifest?
    // It should be known in order to read the manifest in the first place...
    publicFeed: {
      ...ethAddress,
      final: true,
    },
    authorFeed: {
      ...ethAddress,
      final: true,
    },
    profile,
    version: {
      type: 'string', // semver
      final: true,
    },
    contentsHash: bzzHash,
    permissions: permissionsRequirements,
  },
  required: ['profile', 'version', 'contentsHash', 'permissions'],
  compoundIndexes: [['publicFeed', 'version']],
}
