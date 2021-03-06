/**
 * @flow
 * @relayHash a85d047198ee8566a0ac7fc3fe30fb7c
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type EthereumNetworkSelector_user$ref = any;
export type SetEthNetworkInput = {|
  url: string,
  clientMutationId?: ?string,
|};
export type EthereumNetworkSelectorSetEthNetworkMutationVariables = {|
  input: SetEthNetworkInput
|};
export type EthereumNetworkSelectorSetEthNetworkMutationResponse = {|
  +setEthNetwork: ?{|
    +user: {|
      +$fragmentRefs: EthereumNetworkSelector_user$ref
    |}
  |}
|};
export type EthereumNetworkSelectorSetEthNetworkMutation = {|
  variables: EthereumNetworkSelectorSetEthNetworkMutationVariables,
  response: EthereumNetworkSelectorSetEthNetworkMutationResponse,
|};
*/


/*
mutation EthereumNetworkSelectorSetEthNetworkMutation(
  $input: SetEthNetworkInput!
) {
  setEthNetwork(input: $input) {
    user: viewer {
      ...EthereumNetworkSelector_user
      id
    }
  }
}

fragment EthereumNetworkSelector_user on User {
  ethURL
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "kind": "LocalArgument",
    "name": "input",
    "type": "SetEthNetworkInput!",
    "defaultValue": null
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "input",
    "variableName": "input"
  }
];
return {
  "kind": "Request",
  "fragment": {
    "kind": "Fragment",
    "name": "EthereumNetworkSelectorSetEthNetworkMutation",
    "type": "Mutation",
    "metadata": null,
    "argumentDefinitions": (v0/*: any*/),
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "setEthNetwork",
        "storageKey": null,
        "args": (v1/*: any*/),
        "concreteType": "SetEthNetworkPayload",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": "user",
            "name": "viewer",
            "storageKey": null,
            "args": null,
            "concreteType": "User",
            "plural": false,
            "selections": [
              {
                "kind": "FragmentSpread",
                "name": "EthereumNetworkSelector_user",
                "args": null
              }
            ]
          }
        ]
      }
    ]
  },
  "operation": {
    "kind": "Operation",
    "name": "EthereumNetworkSelectorSetEthNetworkMutation",
    "argumentDefinitions": (v0/*: any*/),
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "name": "setEthNetwork",
        "storageKey": null,
        "args": (v1/*: any*/),
        "concreteType": "SetEthNetworkPayload",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": "user",
            "name": "viewer",
            "storageKey": null,
            "args": null,
            "concreteType": "User",
            "plural": false,
            "selections": [
              {
                "kind": "ScalarField",
                "alias": null,
                "name": "ethURL",
                "args": null,
                "storageKey": null
              },
              {
                "kind": "ScalarField",
                "alias": null,
                "name": "id",
                "args": null,
                "storageKey": null
              }
            ]
          }
        ]
      }
    ]
  },
  "params": {
    "operationKind": "mutation",
    "name": "EthereumNetworkSelectorSetEthNetworkMutation",
    "id": null,
    "text": "mutation EthereumNetworkSelectorSetEthNetworkMutation(\n  $input: SetEthNetworkInput!\n) {\n  setEthNetwork(input: $input) {\n    user: viewer {\n      ...EthereumNetworkSelector_user\n      id\n    }\n  }\n}\n\nfragment EthereumNetworkSelector_user on User {\n  ethURL\n}\n",
    "metadata": {}
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '7fcb9152bf8c1fe5059746ff35856643';
module.exports = node;
