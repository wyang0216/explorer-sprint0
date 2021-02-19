import {NormalizedCacheObject} from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import gql from 'graphql-tag';
import {UserStatusConfiguration} from './configuration';
import {
  GetUserStatusQuery,
  GetUserStatusQueryVariables,
  SetUserStatusMutation,
  SetUserStatusMutationVariables,
  UserStatus,
} from './generated/graphql';

export type UserStatusGithubConfiguration = UserStatusConfiguration['github'];

export const GetUserStatusDocument = gql`
  query getUserStatus($login: String!) {
    user(login: $login) {
      status {
        emoji
        message
      }
    }
  }
`;

export const SetUserStatusDocument = gql`
  mutation setUserStatus($emojiText: String!, $text: String!) {
    changeUserStatus(input: {emoji: $emojiText, message: $text}) {
      status {
        emoji
        message
      }
    }
  }
`;

export class GitHub {
  static SetUserStatusDocument = SetUserStatusDocument;

  constructor(
    public readonly client: ApolloClient<NormalizedCacheObject>,
    public readonly username: UserStatusGithubConfiguration['username'],
  ) {}

  async getProfile(): Promise<NonNullable<UserStatus['emoji']>> {
    return this.client
      .query<GetUserStatusQuery, GetUserStatusQueryVariables>({
        query: GetUserStatusDocument,
        variables: {
          login: this.username,
        },
      })
      .then(({data}) => {
        const emoji = data.user?.status?.emoji;
        if (emoji !== undefined && emoji !== null) {
          return emoji.split(':')[1];
        }

        return '';
      })
      .catch(error => {
        throw error;
      });
  }

  async setProfile(emojiText: string, text: string): Promise<void> {
    await this.client
      .mutate<SetUserStatusMutation, SetUserStatusMutationVariables>({
        mutation: GitHub.SetUserStatusDocument,
        variables: {
          emojiText: emojiText === '' ? emojiText : `:${emojiText}:`,
          text,
        },
      })
      .catch(error => {
        throw error;
      });
  }
}
