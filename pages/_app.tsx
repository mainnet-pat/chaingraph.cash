import '../components/logrocket';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { GraphQLClient, ClientContext } from 'graphql-hooks';
import { createClient } from 'graphql-ws';
import Prism from 'prismjs';

(typeof global !== 'undefined' ? global : window).Prism = Prism;

require('prismjs/components/prism-graphql');
require('prismjs/components/prism-json');

// For local development:
// const secureApi = false;
// const hostAndPort = 'localhost:8080';

const secureApi = true;
const hostAndPort = 'demo.chaingraph.cash';

// https://github.com/nearform/graphql-hooks/issues/681
const ssr = typeof window === 'undefined';
const client = new GraphQLClient({
  url: `${secureApi ? 'https' : 'http'}://${hostAndPort}/v1/graphql`,
  ssrMode: false,
  ...(ssr
    ? {}
    : {
        subscriptionClient: createClient({
          url: `${secureApi ? 'wss' : 'ws'}://${hostAndPort}/v1/graphql`,
        }),
      }),
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientContext.Provider value={client}>
      <Component {...pageProps} />
    </ClientContext.Provider>
  );
}

export default MyApp;
