// @flow

import React, { Component } from 'react'
import {
  graphql,
  createFragmentContainer,
  QueryRenderer,
  // $FlowFixMe: requestSubscription not present in Flow definition but exported by library
  requestSubscription,
  type Disposable,
} from 'react-relay'

import { EnvironmentContext } from '../RelayEnvironment'
import LauncherContext, { type CurrentUser } from '../LauncherContext'
import RelayLoaderView from '../RelayLoaderView'
import ContactsView, { type Contact } from './ContactsView'

const CONTACT_CHANGED_SUBSCRIPTION = graphql`
  subscription ContactsScreenContactChangedSubscription {
    contactChanged {
      connectionState
      profile {
        name
        avatar
      }
    }
  }
`

type QueryProps = {
  user: CurrentUser,
}

type Props = QueryProps & {
  contacts: {
    userContacts: Array<Contact>,
  },
}

type State = {
  data: Array<Object>,
}

class ContactsScreenComponent extends Component<Props, State> {
  static contextType = EnvironmentContext

  acceptContact = () => {
    // TODO needs implementing
  }

  ignoreContact = () => {
    // TODO needs implementing
  }

  render() {
    return (
      <ContactsView
        user={this.props.user}
        contacts={this.props.contacts}
        ignoreContact={this.ignoreContact}
        acceptContact={this.acceptContact}
      />
    )
  }
}

const ContactsScreenRelayContainer = createFragmentContainer(
  ContactsScreenComponent,
  {
    contacts: graphql`
      fragment ContactsScreen_contacts on Contacts
        @argumentDefinitions(userID: { type: "String!" }) {
        ...ContactsView_contacts @arguments(userID: $userID)
      }
    `,
  },
)

export class ContactsScreenRenderer extends Component<QueryProps> {
  static contextType = EnvironmentContext

  _subscription: ?Disposable

  componentDidMount() {
    this._subscription = requestSubscription(this.context, {
      subscription: CONTACT_CHANGED_SUBSCRIPTION,
    })
  }

  componentWillUnmount() {
    if (this._subscription != null) {
      this._subscription.dispose()
    }
  }

  render() {
    return (
      <QueryRenderer
        environment={this.context}
        query={graphql`
          query ContactsScreenQuery($userID: String!) {
            viewer {
              contacts {
                ...ContactsScreen_contacts @arguments(userID: $userID)
              }
            }
          }
        `}
        variables={{ userID: this.props.user.localID }}
        render={({ error, props }) => {
          if (error || !props) {
            return <RelayLoaderView error={error ? error.message : undefined} />
          } else {
            return (
              <ContactsScreenRelayContainer {...props.viewer} {...this.props} />
            )
          }
        }}
      />
    )
  }
}

export default class ContactScreen extends Component<{}> {
  static contextType = LauncherContext
  render() {
    return <ContactsScreenRenderer user={this.context.user} {...this.props} />
  }
}