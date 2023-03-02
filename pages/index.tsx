import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { useSubscription, useQuery, ClientContext } from 'graphql-hooks';
import { useContext, useState } from 'react';
import Highlight from 'prism-react-renderer';
import Prism from 'prismjs';
import { exampleQueries } from '../components/examples';

const JSONHighlight = ({ json }: { json: string }) => {
  return (
    <Highlight Prism={Prism as any} code={json} language="json">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
          {tokens.map((line, i) => (
            // eslint-disable-next-line react/jsx-key
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                // eslint-disable-next-line react/jsx-key
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

const QueryComponent = ({ query }: { query: string }) => {
  const { loading, error, data } = useQuery(query, { ssr: false });
  if (loading) return <></>;
  if (error) return <JSONHighlight json={JSON.stringify(error, null, 2)} />;
  return <JSONHighlight json={JSON.stringify(data, null, 2)} />;
};

const SubscriptionComponent = ({ query }: { query: string }) => {
  const [response, setResponse] = useState('');
  useSubscription({ query }, ({ data, errors }) => {
    if (errors) {
      console.log(errors);
      setResponse(JSON.stringify(errors, null, 2));
      return;
    }
    setResponse(JSON.stringify(data, null, 2));
  });
  return <JSONHighlight json={response} />;
};

const ExampleComponent = () => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [activeSubscription, setActiveSubscription] = useState(false);
  const example = exampleQueries[exampleIndex];
  return (
    <div className={styles.examples}>
      <div className={styles.queryInfo}>
        <div className={styles.exampleHeader}>
          <div
            className={styles.previousExample}
            style={
              exampleIndex === 0 ? { opacity: 0.5, cursor: 'default' } : {}
            }
            onClick={() => {
              if (exampleIndex > 0) {
                setExampleIndex(exampleIndex - 1);
                setActiveSubscription(false);
              }
            }}
          >
            ❯
          </div>
          <div
            className={styles.nextExample}
            style={
              exampleIndex === exampleQueries.length - 1
                ? { opacity: 0.5, cursor: 'default' }
                : {}
            }
            onClick={() => {
              if (exampleIndex < exampleQueries.length - 1) {
                setExampleIndex(exampleIndex + 1);
                setActiveSubscription(false);
              }
            }}
          >
            ❯
          </div>
          <div className={styles.selectWrap}>
            <select
              value={exampleIndex}
              onChange={(e) => {
                setExampleIndex(Number(e.target.value));
                setActiveSubscription(false);
              }}
            >
              {exampleQueries.map((example, index) => (
                <option key={index} value={index}>
                  {/* {example.subscribes ? 'Subscription: ' : ''} */}
                  {example.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>{example.description}</div>
        <div className={styles.query}>
          <Highlight
            Prism={Prism as any}
            code={example.query}
            language="graphql"
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={className} style={style}>
                {tokens.map((line, i) => (
                  // eslint-disable-next-line react/jsx-key
                  <div {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                      // eslint-disable-next-line react/jsx-key
                      <span {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
      <div className={styles.results}>
        {example.mock ? (
          <JSONHighlight json={example.mock} />
        ) : example.subscribes ? (
          activeSubscription ? (
            <SubscriptionComponent query={example.query} />
          ) : (
            <div className={styles.resultsCenter}>
              <div
                className={styles.subscribeButton}
                onClick={() => {
                  setActiveSubscription(true);
                }}
              >
                Run Subscription ❯
              </div>
            </div>
          )
        ) : (
          <QueryComponent query={example.query} />
        )}
      </div>
    </div>
  );
};

const chaingraphBox = `..............................................................
:                                                            :
:                                                            :
:                                                            :
:                                                            :
:                                                            :
:                                                            :
:............................................................:`;

const chaingraphAscii = `                                                            
     ____ _           _                             _       
    / ___| |__   __ _(_)_ __   __ _ _ __ __ _ _ __ | |__    
   | |   | '_ \\ / _\` | | '_ \\ / _\` | '__/ _\` | '_ \\| '_ \\   
   | |___| | | | (_| | | | | | (_| | | | (_| | |_) | | | |  
    \\____|_| |_|\\__,_|_|_| |_|\\__, |_|  \\__,_| .__/|_| |_|  
                              |___/          |_|            
                                                            `;

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      dateString: new Date().toUTCString().slice(0, -4),
    },
  };
};

const Home: NextPage<{ date: string }> = ({ date }) => {
  const client = useContext(ClientContext) as any;
  return (
    <div className={styles.container}>
      <Head>
        <title>Chaingraph | blockchain indexer and GraphQL API</title>
        <meta
          name="description"
          content="Chaingraph is an open-source, multi-node blockchain indexer and GraphQL API. Powerful, nested queries and horizontally-scalable live subscriptions, deployed on your own infrastructure."
        />
        <meta
          property="og:title"
          content="Chaingraph | blockchain indexer and GraphQL API"
        />
        <meta
          property="og:description"
          content="Chaingraph is an open-source, multi-node blockchain indexer and GraphQL API. Powerful, nested queries and horizontally-scalable live subscriptions, deployed on your own infrastructure."
        />
        <meta
          property="og:image"
          content="https://chaingraph.cash/social.png"
        />
        <meta property="og:url" content="https://chaingraph.cash/" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@ChaingraphCash" />
        <meta
          name="twitter:title"
          content="Chaingraph | blockchain indexer and GraphQL API"
        />
        <meta
          name="twitter:description"
          content="Chaingraph is an open-source, multi-node blockchain indexer and GraphQL API. Powerful, nested queries and horizontally-scalable live subscriptions, deployed on your own infrastructure."
        />
        <meta
          name="twitter:image"
          content="https://chaingraph.cash/social.png"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.topLink}>
        <a href="https://github.com/bitauth/chaingraph">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="15.605"
            viewBox="0 0 16 15.605"
          >
            <path
              d="M144.319,107.44a8,8,0,0,0-2.528,15.591c.4.073.546-.173.546-.386,0-.19-.007-.693-.011-1.361-2.225.484-2.695-1.072-2.695-1.072a2.119,2.119,0,0,0-.888-1.17c-.726-.5.055-.486.055-.486a1.68,1.68,0,0,1,1.225.824,1.7,1.7,0,0,0,2.328.665,1.71,1.71,0,0,1,.508-1.07c-1.776-.2-3.644-.888-3.644-3.954a3.093,3.093,0,0,1,.824-2.147,2.874,2.874,0,0,1,.079-2.117s.671-.215,2.2.82a7.587,7.587,0,0,1,4.006,0c1.527-1.035,2.2-.82,2.2-.82a2.875,2.875,0,0,1,.08,2.117,3.087,3.087,0,0,1,.822,2.147c0,3.073-1.871,3.75-3.653,3.948a1.91,1.91,0,0,1,.543,1.482c0,1.07-.01,1.933-.01,2.195,0,.214.144.463.55.385a8,8,0,0,0-2.534-15.59Z"
              transform="translate(-136.32 -107.44)"
              fill="#B0EB8F"
              fillRule="evenodd"
            />
          </svg>
        </a>
      </div>

      <div className={styles.intro}>
        <div className={styles.promptLine}>
          <span className={styles.prompt}>❯</span>{' '}
          <span>helm install my-chaingraph bitauth/chaingraph</span>
        </div>
        <div className={styles.out1}>
          Release &quot;my-chaingraph&quot; does not exist. Installing it now.
        </div>
        <div className={styles.out2}>NAME: my-chaingraph</div>
        <div className={styles.out2}>LAST DEPLOYED: {date}</div>
        <div className={styles.out2}>NAMESPACE: default</div>
        <div className={styles.out2}>STATUS: deployed</div>
        <div className={styles.out2}>REVISION: 1</div>
        <div className={styles.title}>
          {/* prettier-ignore */}
          <pre className={styles.box}>{chaingraphBox}</pre>
          <pre className={styles.ascii}>{chaingraphAscii}</pre>
        </div>
      </div>

      <p className={styles.lead}>
        Chaingraph is a multi-node blockchain indexer and GraphQL API.
      </p>

      <div className={styles.ctas}>
        <a
          className={styles.primaryCta}
          href="https://github.com/bitauth/chaingraph#chaingraph"
        >
          Setup Guide
        </a>
        <a className={styles.secondaryCta} href={`try/index.html?graphql=${client.url}`}>
          Try the API ❯
        </a>
      </div>

      <div className={styles.feature}>
        <h2>Powerful Queries, Live Subscriptions</h2>

        <p>
          Chaingraph provides an intuitive GraphQL API with support for
          efficient, nested queries and powerful blockchain analysis. And any
          query can be a live subscription, able to horizontally scale to
          millions of subscribers.
        </p>

        <p>
          Request precisely what you need in a single query, saving bandwidth
          and eliminating client-side data manipulation. Try some examples
          below.
        </p>
      </div>

      <ExampleComponent />

      <div className={styles.ctas}>
        <h2>Get Started</h2>
        <p>
          Learn how to deploy and customize your own Chaingraph instance, or
          experiment with the API in the Chaingraph GraphQL Playground.
        </p>
        <a
          className={styles.primaryCta}
          href="https://github.com/bitauth/chaingraph#chaingraph"
        >
          Setup Guide
        </a>
        <a className={styles.secondaryCta} href={`try/index.html?graphql=${client.url}`}>
          Try the API ❯
        </a>
      </div>

      <footer className={styles.footer}>
        <a
          href="https://github.com/bitauth/chaingraph"
          target="_blank"
          rel="noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
            <path
              d="M6 0a6.076 6.076 0 0 0-6 6.152 6.136 6.136 0 0 0 4.1 5.836c.3.054.413-.131.413-.292 0-.146-.007-.631-.007-1.146-1.508.285-1.9-.377-2.018-.723a2.236 2.236 0 0 0-.615-.869c-.21-.115-.51-.4-.008-.408a1.2 1.2 0 0 1 .923.631 1.265 1.265 0 0 0 1.748.508 1.306 1.306 0 0 1 .383-.823A2.691 2.691 0 0 1 2.19 5.829a2.428 2.428 0 0 1 .615-1.653 2.262 2.262 0 0 1 .06-1.63s.5-.161 1.65.631a5.522 5.522 0 0 1 3 0c1.148-.8 1.65-.631 1.65-.631a2.262 2.262 0 0 1 .06 1.63 2.414 2.414 0 0 1 .615 1.653A2.692 2.692 0 0 1 7.1 8.866 1.477 1.477 0 0 1 7.508 10c0 .823-.008 1.484-.008 1.692 0 .161.112.354.412.292A6.15 6.15 0 0 0 12 6.152 6.076 6.076 0 0 0 6 0Z"
              fill="#ade88d"
              fillRule="evenodd"
            />
          </svg>{' '}
          GitHub
        </a>
        <a href="https://t.me/chaingraph_dev" target="_blank" rel="noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
            <path
              d="M6 12a6.044 6.044 0 0 1-1.209-.122 5.967 5.967 0 0 1-2.145-.9A6.018 6.018 0 0 1 .472 8.335a5.97 5.97 0 0 1-.35-1.126 6.059 6.059 0 0 1 0-2.418 5.967 5.967 0 0 1 .9-2.145A6.017 6.017 0 0 1 3.665.472a5.969 5.969 0 0 1 1.126-.35 6.058 6.058 0 0 1 2.418 0 5.967 5.967 0 0 1 2.145.9 6.017 6.017 0 0 1 2.174 2.64 5.97 5.97 0 0 1 .35 1.126 6.058 6.058 0 0 1 0 2.418 5.967 5.967 0 0 1-.9 2.145 6.018 6.018 0 0 1-2.64 2.174 5.971 5.971 0 0 1-1.126.35A6.044 6.044 0 0 1 6 12Zm1.135-7.1a.063.063 0 0 1 .066.035c.03.072-.07.243-.178.351-.46.46-1.208 1.173-1.821 1.734a.394.394 0 0 0-.162.289.375.375 0 0 0 .144.266c.353.3 1.17.832 1.562 1.089.1.068.174.114.189.125a1.662 1.662 0 0 0 .774.322A.4.4 0 0 0 7.8 9.1a.35.35 0 0 0 .179-.1.52.52 0 0 0 .1-.158.777.777 0 0 0 .054-.208l.434-2.723.113-.738c.095-.613.169-1.1.182-1.273a.4.4 0 0 0-.073-.309.307.307 0 0 0-.237-.087.828.828 0 0 0-.262.05c-.014.006-1.358.557-1.751.728L2.5 5.948a1.094 1.094 0 0 0-.321.177.248.248 0 0 0-.094.157c-.011.12.119.2.12.2s.612.21 1.127.364a1.445 1.445 0 0 0 .413.065.782.782 0 0 0 .385-.082l2.442-1.644a1.394 1.394 0 0 1 .563-.285Z"
              fill="#b0eb8f"
            />
          </svg>
          Discuss
        </a>

        <a
          href="https://hub.docker.com/u/chaingraph"
          target="_blank"
          rel="noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
            <path
              d="M6 12a6.007 6.007 0 0 1-6-6 6.006 6.006 0 0 1 6-6 6.007 6.007 0 0 1 6 6 6.007 6.007 0 0 1-6 6ZM2.26 5.84a.259.259 0 0 0-.258.258 3.883 3.883 0 0 0 .239 1.409 2.1 2.1 0 0 0 .833 1.084 3.691 3.691 0 0 0 1.829.393 5.668 5.668 0 0 0 1.014-.093 4.173 4.173 0 0 0 1.327-.482 3.613 3.613 0 0 0 .9-.74 4.886 4.886 0 0 0 .883-1.525h.077a1.263 1.263 0 0 0 .93-.351 1.024 1.024 0 0 0 .247-.363l.035-.1-.079-.058a1.1 1.1 0 0 0-.679-.177 2.1 2.1 0 0 0-.351.031 1.314 1.314 0 0 0-.584-.884l-.01-.007-.12-.069-.077.112a1.655 1.655 0 0 0-.212.493 1.175 1.175 0 0 0 .14.922 1.674 1.674 0 0 1-.607.147Zm4.588-.946a.066.066 0 0 0-.066.066v.656a.069.069 0 0 0 .066.066h.734a.066.066 0 0 0 .066-.066V4.96a.066.066 0 0 0-.066-.066Zm-1.022 0a.066.066 0 0 0-.066.066v.656a.065.065 0 0 0 .066.066h.734a.066.066 0 0 0 .066-.066V4.96a.066.066 0 0 0-.066-.066Zm-1.014 0a.066.066 0 0 0-.066.066v.656a.063.063 0 0 0 .066.066h.733a.065.065 0 0 0 .066-.066V4.96a.066.066 0 0 0-.066-.066Zm-1.031 0a.066.066 0 0 0-.066.066v.656a.069.069 0 0 0 .066.066h.734a.066.066 0 0 0 .066-.066V4.96a.066.066 0 0 0-.066-.066Zm-1.011 0a.066.066 0 0 0-.066.066v.656a.069.069 0 0 0 .066.066h.733a.066.066 0 0 0 .066-.066V4.96a.066.066 0 0 0-.066-.066Zm3.055-.938a.066.066 0 0 0-.066.066v.656a.067.067 0 0 0 .066.066h.734a.068.068 0 0 0 .066-.066v-.656a.068.068 0 0 0-.066-.066Zm-1.014 0a.066.066 0 0 0-.066.066v.656a.065.065 0 0 0 .066.066h.733a.067.067 0 0 0 .066-.066v-.656a.066.066 0 0 0-.066-.066Zm-1.031 0a.066.066 0 0 0-.066.066v.656a.071.071 0 0 0 .066.066h.734a.068.068 0 0 0 .066-.066v-.656a.066.066 0 0 0-.066-.066Zm2.045-.94a.066.066 0 0 0-.066.066v.656a.068.068 0 0 0 .066.066h.734a.066.066 0 0 0 .066-.066v-.656a.068.068 0 0 0-.066-.066Z"
              fill="#b0eb8f"
            />
          </svg>{' '}
          Docker
        </a>
        <a
          href="https://twitter.com/ChaingraphCash"
          target="_blank"
          rel="noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
            <path
              d="M6 0a6 6 0 1 0 6 6 6 6 0 0 0-6-6Zm3.033 4.823A4.084 4.084 0 0 1 2.75 8.449a2.889 2.889 0 0 0 2.126-.595 1.439 1.439 0 0 1-1.342-1 1.44 1.44 0 0 0 .649-.024 1.438 1.438 0 0 1-1.152-1.424 1.433 1.433 0 0 0 .651.18 1.438 1.438 0 0 1-.444-1.918 4.076 4.076 0 0 0 2.96 1.5 1.437 1.437 0 0 1 2.448-1.31 2.865 2.865 0 0 0 .912-.349 1.442 1.442 0 0 1-.632.795 2.865 2.865 0 0 0 .825-.227 2.883 2.883 0 0 1-.718.746Z"
              fill="#ade88d"
            />
          </svg>
          Twitter
        </a>
      </footer>

      <div className={styles.madeBy}>
        made by&nbsp;<a href="https://bitjson.com/">bitjson</a>
      </div>

      <div className={styles.madeBy} style={{display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30}}>
        <div>This instance is brought to you by <a href={process.env.NEXT_PUBLIC_MAINTAINER_HREF!}>{process.env.NEXT_PUBLIC_MAINTAINER_NAME!}</a></div>
        <div>
          <a href={`${process.env.NEXT_PUBLIC_MAINTAINER_ADDRESS}?amount=0.1337`}>
            <Image
              width={150}
              height={150}
              src={process.env.NEXT_PUBLIC_MAINTAINER_QR_SRC!}
              title={process.env.NEXT_PUBLIC_MAINTAINER_ADDRESS!}
              alt={process.env.NEXT_PUBLIC_MAINTAINER_ADDRESS!}
            />
          </a>
        </div>
        <div>{process.env.NEXT_PUBLIC_MAINTAINER_CASHACCOUNT!}</div>
        <span>{process.env.NEXT_PUBLIC_MAINTAINER_ADDRESS!}</span>
      </div>
    </div>
  );
};

export default Home;
