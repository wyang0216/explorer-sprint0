import {InMemoryCache, NormalizedCacheObject} from 'apollo-cache-inmemory';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {createHttpLink} from 'apollo-link-http';
import fetch from 'node-fetch';

export const createGithubClient = (
  accessToken: string,
): ApolloClient<NormalizedCacheObject> => {
  const authLink = setContext((_, {headers}) => {
    return {
      headers: {
        ...(headers || {}),
        authorization: `Bearer ${accessToken}`,
      },
    };
  });

  const cache = new InMemoryCache();

  const httpLink = createHttpLink({
    uri: 'https://api.github.com/graphql',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetch: fetch as any,
  });

  const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
    cache,
    link: authLink.concat(httpLink),
  });

  return client;
};
