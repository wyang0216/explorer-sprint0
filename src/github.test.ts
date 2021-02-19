import {NormalizedCacheObject} from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import fetch from 'node-fetch';
import {GitHub, SetUserStatusDocument} from './github';

jest.mock('node-fetch');

describe('Github', () => {
  describe('#getProfile', () => {
    let apolloClient: ApolloClient<NormalizedCacheObject>;

    beforeEach(() => {
      apolloClient = ({
        query: jest.fn().mockResolvedValueOnce({
          data: {
            user: {
              status: {
                emoji: ':coffee:',
              },
            },
          },
        }),
      } as unknown) as ApolloClient<NormalizedCacheObject>;

      ((fetch as unknown) as jest.Mock).mockResolvedValueOnce({
        /* eslint-disable @typescript-eslint/camelcase */
        json: jest.fn().mockResolvedValueOnce({
          ok: true,
          profile: {
            status_text: 'Taking a break',
            status_emoji: ':coffee:',
          },
        }),
        /* eslint-enable @typescript-eslint/camelcase */
      });
    });

    afterEach(() => {
      ((fetch as unknown) as jest.Mock).mockReset();
    });

    it('returns value', async () => {
      const github = new GitHub(apolloClient, 'bb');

      await expect(github.getProfile()).resolves.toBe('coffee');
    });
  });

  describe('#setProfile', () => {
    let apolloClient: ApolloClient<NormalizedCacheObject>;

    beforeEach(() => {
      apolloClient = ({
        mutate: jest.fn().mockResolvedValueOnce({
          data: {
            changeUserStatus: {
              status: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                status_text: 'Taking a break',
                emoji: ':coffee:',
              },
            },
          },
        }),
      } as unknown) as ApolloClient<NormalizedCacheObject>;
    });

    afterEach(() => {
      ((fetch as unknown) as jest.Mock).mockReset();
    });

    it('is called with "coffee", "Taking a break"', async () => {
      const emojiName = 'coffee';
      const text = 'Taking a break';

      const github = new GitHub(apolloClient, 'aa');

      await github.setProfile(emojiName, text);

      expect(apolloClient.mutate).toHaveBeenCalledWith({
        mutation: SetUserStatusDocument,
        variables: {
          emojiText: ':coffee:',
          text,
        },
      });
    });

    it('is called with "", ""', async () => {
      const emojiName = '';
      const text = '';

      const github = new GitHub(apolloClient, 'aa');

      await github.setProfile(emojiName, text);

      expect(apolloClient.mutate).toHaveBeenCalledWith({
        mutation: SetUserStatusDocument,
        variables: {
          emojiText: '',
          text,
        },
      });
    });
  });
});
