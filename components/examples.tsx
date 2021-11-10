export interface Example {
  mock?: string;
  name: string;
  description: JSX.Element;
  subscribes: boolean;
  query: string;
}

export const exampleQueries: Example[] = [
  {
    name: 'Monitor Mempools',
    description: (
      <>
        <p>
          Monitor the mempools of each node connected to Chaingraph, returning
          the unconfirmed transaction count and a few fields from the latest 5
          transactions in each mempool.
        </p>
        <p>
          In the Chaingraph GraphQL schema, the <code>transaction</code>{' '}
          currently has 30 fields. By choosing only fields which are useful to
          your application, you can reduce bandwidth requirements and avoid the
          need for data-reformatting logic. See the <code>Get Transaction</code>{' '}
          example for a sample of other available fields.
        </p>
      </>
    ),
    subscribes: true,
    query: /* graphql */ `subscription MonitorMempools {
  node {
    name
    user_agent
    unconfirmed_transaction_count
    unconfirmed_transactions(
      limit: 5,
      order_by: { validated_at: desc }
    ) {
      validated_at
      transaction {
        hash
        input_count
        output_count
        output_value_satoshis
        size_bytes
      }
    }
  }
}`,
  },
  {
    name: 'Monitor Sync Status',
    description: (
      <>
        <p>
          This example returns the list of nodes connected to Chaingraph, their
          version information, and the hash, height, size, and transaction count
          of the most recently saved block accepted by that node.
        </p>
        <p>
          Note, Chaingraph saves blocks asynchronously, and large blocks can
          take longer to save to the database. During initial sync, this may
          cause the subscription to occasionally update its result with
          lower-height (more recently saved) blocks. Regardless, this
          subscription will roughly track sync progress for each connected node.
        </p>
        <p>
          This query could also be ordered by block height, but because
          non-primary indexes are created after initial sync (to reduce time
          required), ordering by block height can be slow until after the
          initial sync is complete.
        </p>
      </>
    ),
    query: /* graphql */ `subscription MonitorSyncTips {
  node {
    name
    user_agent
    latest_tip: accepted_blocks(
      limit: 1
      order_by: { block_internal_id: desc }
    ) {
      accepted_at
      block {
        hash
        height
        transaction_count
        size_bytes
      }
    }
  }
}`,
    subscribes: true,
  },
  {
    description: (
      <>
        <p>
          Monitor for payments to an address, returning details for any payments
          and the validation time according to each validating node.
        </p>
        <p>
          When a matching payment is found, this subscription also monitors for
          any conflicts with that payment (like double-spend attempts).
        </p>
        <p>
          Note: Chaingraph does not yet support storage or relaying of{' '}
          <a href="https://documentation.cash/protocol/network/messages/dsproof-beta">
            Double Spend Proofs (DSPs)
          </a>
          . When DSPs are supported, this query should be improved to also
          report on any received DSPs.
        </p>
      </>
    ),
    name: 'Monitor Address for Payments',
    query: /* graphql */ `subscription MonitorForPayments {
  search_output(
    args: {
      locking_bytecode_hex: "{76a914f77f2d9ab6cc90f2e2bef66c78c7c0a33475be5688ac}"
    }
  ) {
    transaction_hash
    output_index
    value_satoshis
    transaction {
      node_validations {
        validated_at
        node {
          name
        }
      }
      node_validation_timeline {
        replaced_at
        validated_at
        node {
          name
        }
      }
      block_inclusions {
        block {
          hash
          height
          accepted_by {
            accepted_at
            node {
              name
            }
          }
        }
      }
    }
  }
}
`,
    subscribes: true,
  },
  {
    name: 'Inspect Duplicate Transactions',
    description: (
      <>
        <p>
          This query returns details on a set of unusual historical transactions
          – due to some poorly defined behavior in early versions of Bitcoin,
          the blockchain includes duplicate coinbase transactions across several
          blocks. More details on the issue and resolution can be found in{' '}
          <a
            href="https://github.com/bitcoin/bips/blob/master/bip-0030.mediawiki"
            target="_blank"
            rel="noreferrer"
          >
            BIP30
          </a>
          ,{' '}
          <a
            href="https://github.com/bitcoin/bips/blob/master/bip-0034.mediawiki"
            target="_blank"
            rel="noreferrer"
          >
            BIP34
          </a>
          , and{' '}
          <a
            href="https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/commit/ab91bf39b7c11e9c86bb2043c24f0f377f1cf514"
            target="_blank"
            rel="noreferrer"
          >
            commit <code>ab91bf39</code>
          </a>
          .
        </p>
        <p>
          This example demonstrates how Chaingraph&apos;s{' '}
          <code>block_inclusions</code> field can represent that a transaction
          is included in multiple blocks. While such events can no longer happen
          on the same chain, they are common during chain splits, and Chaingraph
          allows you to handle them deliberately in your business logic.
        </p>
      </>
    ),
    query: /* graphql */ `query ShowDuplicateTransactions {
  transaction( where: { hash: { _in: [
    "\\\\xe3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468"
    "\\\\xd5d27987d2a3dfc724e359870c6644b40e497bdc0589a033220fe15429d88599"
  ] } } ) {
    hash
    is_coinbase
    output_value_satoshis
    block_inclusions {
      block {
        hash
        height
        timestamp
        size_bytes
        version
        nonce
        merkle_root
        bits
        accepted_by {
          node {
            name
            user_agent
          }
        }
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Given a transaction hash and output index, return a list of all known
          transactions spending a particular transaction output.
        </p>
        <p>
          For each transaction, return the list of nodes currently regarding the
          transaction as valid but unconfirmed, a timeline of any double-spend
          activity, and the list of known blocks including the transaction. For
          each known block, include the list of nodes which currently considered
          that block a part of the valid chain.
        </p>
        <p>
          Note, while this query will typically return only one transaction
          result (unless a successful double-spend occurred and Chaingraph heard
          the earlier spend), it can be valuable to handle exceptions properly
          in client software to ensure smooth handling of unusual network
          activity.
        </p>
        <p>
          If the queried transaction output has been &ldquo;split&rdquo; and
          spent in different transactions on either side of a chain split – and
          Chaingraph is connected to at least one node on each side – the query
          will simultaneously provide information about both resulting
          transactions.
        </p>
      </>
    ),
    name: 'Get Spending Transactions',
    query: /* graphql */ `query GetSpendingTransactions {
  output(
    where: {
      transaction_hash: {
        _eq: "\\\\xf4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16"
      }
      output_index: { _eq: "0" }
    }
  ) {
    transaction_hash
    output_index
    value_satoshis
    locking_bytecode_pattern
    spent_by {
      unlocking_bytecode_pattern
      outpoint_index
      transaction {
        hash
        node_validations {
          validated_at
          node {
            name
          }
        }
        node_validation_timeline {
          node {
            name
          }
          validated_at
          replaced_at
        }
        block_inclusions {
          transaction_index
          block {
            hash
            height
            accepted_by {
              accepted_at
              node {
                name
                user_agent
              }
            }
          }
        }
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Given a transaction hash, get transaction details. This example
          demonstrates many of Chaingraph&apos;s built-in, non-aggregation{' '}
          <code>transaction</code> fields, as well as fields available for{' '}
          <code>input</code>s and <code>output</code>s.
        </p>
      </>
    ),
    name: 'Get Transaction Details',
    query: /* graphql */ `query GetTransactionDetails {
  transaction(where: { hash: { _eq:
  "\\\\x978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1"
  } } ) {
    authchains {
      authchain_length
      authhead_transaction_hash
      authhead {
        block_inclusions {
          block {
            height
          }
        }
      }
      migrations {
        migration_index
        transaction {
          hash
        }
      }
      unspent_authhead
    }
    block_inclusions {
      transaction_index
      block {
        height # etc.
      }
    }
    data_carrier_outputs {
      locking_bytecode # etc.
    }
    encoded_hex
    fee_satoshis
    hash
    identity_output {
      spent_by {
        input_index # etc.
        transaction {
          hash
        }
      }
    }
    input_count
    input_value_satoshis
    inputs {
      input_index
      outpoint_index
      outpoint_transaction_hash
      redeem_bytecode_pattern
      sequence_number
      unlocking_bytecode
      unlocking_bytecode_pattern
      value_satoshis
    }
    is_coinbase
    locktime
    node_validation_timeline {
      validated_at
      replaced_at
      node {
        name # etc.
      }
    }
    node_validations {
      validated_at
      node {
        name
      }
    }
    output_count
    output_value_satoshis
    outputs {
      locking_bytecode
      locking_bytecode_pattern
      output_index
      spent_by {
        input_index
        transaction {
          hash
        }
      }
    }
    signing_output {
      spent_by {
        input_index # etc.
        transaction {
          hash
        }
      }
    }
    size_bytes
    version
  }
}
`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Given a block height, get block details. This example demonstrates
          many of Chaingraph&apos;s built-in, non-aggregation <code>block</code>{' '}
          fields, as well as fields available for <code>node</code>s.
        </p>
      </>
    ),
    name: 'Get Block Details',
    query: /* graphql */ `query GetBlockDetails {
  block(where: {height:{_eq: 0}}){
    accepted_by {
      accepted_at # "null" if only known via historical sync
      node {
        first_connected_at
        latest_connection_began_at
        name
        protocol_version
        unconfirmed_transaction_count
        user_agent
      }
    }
    bits
    encoded_hex
    fee_satoshis
    generated_value_satoshis
    hash
    header
    height
    input_count
    input_value_satoshis
    merkle_root
    nonce
    output_count
    output_value_satoshis
    previous_block_hash
    size_bytes
    timestamp
    transaction_count
    version
  }
}

`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Get all known blocks with a height of <code>0</code> (genesis blocks).
          For each genesis block, list the nodes which accept the block and
          their version information.
        </p>
        <p>
          This example demonstrates the <code>encoded_hex</code> field, which is
          available for both full blocks and individual transactions. You can
          also retrieve only the header component of hex-encoded blocks using
          the <code>header</code> field.
        </p>
      </>
    ),
    name: 'Get Raw Blocks',
    query: /* graphql */ `query GenesisBlockInfo {
  block(where: { height: { _eq: "0" } }) {
    hash
    height
    header
    encoded_hex
    accepted_by {
      node {
        name
        user_agent
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Return all outputs which match a provided locking bytecode prefix. In
          this example, we search for a <code>locking_bytecode</code> prefix
          which matches the destination of the first P2P bitcoin transaction.
        </p>
        <p>
          The <code>search_output_prefix</code> method uses an index which
          stores up to 26 bytes per output – enough to search all P2PKH and P2SH
          outputs, and usually enough to filter data carrier outputs for most
          use cases.
        </p>
        <p>
          To return any results, the locking bytecode prefix must be both
          shorter than this value and provided in hex format.
        </p>
      </>
    ),
    name: 'Search Outputs (By Prefix)',
    query: /* graphql */ `query SearchOutputsByLockingBytecodePrefix {
  search_output_prefix(
    args: { locking_bytecode_prefix_hex: "4104ae1a62fe09c5f51b13905f07f06b99" }
  ) {
    locking_bytecode
    output_index
    transaction_hash
    value_satoshis
    transaction {
      block_inclusions {
        block {
          hash
          height
        }
      }
    }
    spent_by {
      input_index
      transaction {
        hash
        block_inclusions {
        block {
          hash
          height
        }
      }
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Return all outputs which match a list of locking bytecode values (i.e.
          decoded addresses). For each spent output, indicate the spending
          transaction(s).
        </p>
        <p>
          This query is useful for quickly identifying all spending history and
          unspent funds held by a wallet. (Note: this query does not identify
          the chain on which outputs are located. If the Chaingraph instance
          supports multiple chains, clients should disambiguate using{' '}
          <code>block_inclusions</code> and/or <code>node_validations</code>.)
        </p>
        <p>
          The <code>search_output</code> method uses an index which stores up to
          26 bytes per output – enough for all P2PKH and P2SH outputs. To return
          any results, the locking bytecode values must be both shorter than
          this value and provided in hex format.
        </p>
      </>
    ),
    name: 'Search Outputs (Grouped)',
    query: /* graphql */ `query SearchOutputsByLockingBytecode {
  search_output(
    args: {
      locking_bytecode_hex: "{76a9148d1ec2350813b2a071353e16b41e884647405d3d88ac, 76a914047a813bf93223971cf6f8ff7479a7b36fefe1f888ac}"
    }
  ) {
    locking_bytecode
    output_index
    transaction_hash
    value_satoshis
    spent_by {
      input_index
      transaction {
        hash
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          Get the total number of{' '}
          <a href="https://www.cashaccount.info/">CashAccounts</a> ever created
          (on any tracked chains).
        </p>
        <p>
          Because CashAccounts can be found via a locking bytecode prefix, this
          query operates using only the the built-in output searching index (no
          additional indexing is required).
        </p>
        <p>
          Note, this example result is not updated. Because aggregate queries
          are relatively expensive, anonymous users are not authorized to make
          aggregate queries on the demo instance. Applications which regularly
          rely on expensive queries should either pre-compute results using
          expression indexes, triggers and tables, etc. or request and cache
          results infrequently.
        </p>
      </>
    ),
    name: 'Count CashAccounts',
    query: /* graphql */ `query CountCashAccountOutputs {
  search_output_prefix_aggregate(
    args: { locking_bytecode_prefix_hex: "6a0401010101" }
  ) {
    aggregate {
      count
    }
  }
}`,
    subscribes: false,
    mock: `{
  "data": {
    "search_output_prefix_aggregate": {
      "aggregate": {
        "count": 25923
      }
    }
  }
}`,
  },
  {
    description: (
      <>
        <p>
          Given a <a href="https://www.cashaccount.info/">CashAccount</a> name
          and block height, return all possible matching transactions, the
          contents of their data carrier outputs, and the hash of the blocks in
          which they were included (for computing each result&apos;s Collision
          Avoidance Part).
        </p>
      </>
    ),
    name: 'CashAccount Lookup',
    query: /* graphql */ `query GetJonathan100CashAccount {
  search_output_prefix(
    args: { locking_bytecode_prefix_hex: "6a0401010101084a6f6e617468616e" }
    where: {
      transaction: { block_inclusions: { block: { height: { _eq: 563720 } } } }
    }
  ) {
    transaction {
      hash
      data_carrier_outputs {
        locking_bytecode
        output_index
      }
      block_inclusions {
        block {
          hash
          height
        }
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    description: (
      <>
        <p>
          This example demonstrates a full{' '}
          <a href="https://www.cashaccount.info/">CashAccount</a>-to-
          <a href="https://github.com/bitauth/bitauth-cli">Bitauth</a> lookup in
          a single query.
        </p>
        <p>
          Given a CashAccount name and block height, get all matching
          CashAccounts, their block inclusion details, and all authchains{' '}
          (including across chain splits). Return all authhead information and
          the list of migration transactions previously made by the identity.
        </p>
      </>
    ),
    name: 'CashAccount Bitauth Lookup',
    query: /* graphql */ `query GetBitjson100Authchain {
  search_output_prefix(
    args: { locking_bytecode_prefix_hex: "6a0401010101076269746a736f6e" }
    where: {
      transaction: { block_inclusions: { block: { height: { _eq: 563720 } } } }
    }
  ) {
    transaction {
      hash
      block_inclusions {
        block {
          hash
          height
        }
      }
      authchains {
        authchain_length
        authhead {
          hash
          identity_output {
            locking_bytecode
            value_satoshis
          }
          signing_output {
            locking_bytecode
            value_satoshis
          }
          data_carrier_outputs {
            locking_bytecode
            value_satoshis
            output_index
          }
        }
        migrations {
          migration_index
          transaction {
            hash
            encoded_hex
          }
        }
      }
    }
  }
}`,
    subscribes: false,
  },
  {
    name: 'Aggregate Blockchain Size',
    description: (
      <>
        <p>
          This example demonstrates a simple Chaingraph aggregation query: it
          returns the combined byte size of all blocks which have been accepted
          by the node labeled <code>bchn</code>, i.e. the raw size of the
          blockchain according to <code>bchn</code>.
        </p>
        <p>
          Aggregation queries can be useful for performing simple analyses on
          blockchain data with minimal development effort. (Of course, more
          complex analysis can always be performed directly on Chaingraph&apos;s
          underlying Postgres SQL database.)
        </p>
        <p>
          Note, this example result is not updated. Because aggregate queries
          are relatively expensive, anonymous users are not authorized to make
          aggregate queries on the demo instance. Applications which regularly
          rely on expensive queries should either pre-compute results using
          expression indexes, triggers and tables, etc. or request and cache
          results infrequently.
        </p>
      </>
    ),
    query: /* graphql */ `query BlockchainSize {
  bchn_blocks: block_aggregate(
    where: { accepted_by: { node: { name: { _eq: "bchn" } } } }
    ) {
    aggregate {
      sum {
        size_bytes
      } 
    }
  }
}`,
    subscribes: false,
    mock: /* JSON */ `{
  "data": {
    "bchn_blocks": {
      "aggregate": {
        "sum": {
          "size_bytes": 174014547351
        }
      }
    }
  }
}`,
  },
  {
    description: (
      <>
        <p>
          Get the average size of all blocks accepted by a particular node since
          a provided date. In this example, stats are computed for all blocks
          accepted by <code>bchn</code> after January of 2021.
        </p>
        <p>
          Aggregation queries can be useful for performing simple analyses on
          blockchain data with minimal development effort. (Of course, more
          complex analysis can always be performed directly on Chaingraph&apos;s
          underlying Postgres SQL database.)
        </p>
        <p>
          Note, this example result is not updated. Because aggregate queries
          are relatively expensive, anonymous users are not authorized to make
          aggregate queries on the demo instance. Applications which regularly
          rely on expensive queries should either pre-compute results using
          expression indexes, triggers and tables, etc. or request and cache
          results infrequently.
        </p>
      </>
    ),
    name: 'Aggregate Blockchain Stats After Date',
    query: /* graphql */ `query BlockSizeStatsSince2021 {
    block_aggregate(
      where: {
        accepted_by: { node: { name: { _eq: "bchn" } } }
        timestamp: { _gt: "1609459200" }
      }
    ) {
      aggregate {
        count
        max { size_bytes }
        min { size_bytes }
        avg { size_bytes }
        sum { size_bytes }
      }
    }
  }`,
    subscribes: false,
    mock: `{
  "data": {
    "block_aggregate": {
      "aggregate": {
        "count": 44934,
        "max": {
          "size_bytes": 7999292
        },
        "min": {
          "size_bytes": 242
        },
        "avg": {
          "size_bytes": 517787.83064049494
        },
        "sum": {
          "size_bytes": 23266278382
        }
      }
    }
  }
}`,
  },
  {
    description: (
      <>
        <p>
          Get the transaction count, and the maximum, minimum, sum, and average
          size of all transactions mined on a particular chain between two
          dates. In this example, stats are computed for all transactions
          contained in blocks accepted by <code>bchn</code> between January and
          March of 2021.
        </p>
        <p>
          Aggregation queries can be useful for performing simple analyses on
          blockchain data with minimal development effort. (Of course, more
          complex analysis can always be performed directly on Chaingraph&apos;s
          underlying Postgres SQL database.)
        </p>
      </>
    ),
    name: 'Aggregate Transaction Stats Between Two Dates',
    query: /* graphql */ `query TransactionStats2021Q1 {
  transaction_aggregate(
    where: {
      block_inclusions: {
        block: {
          accepted_by: { node: { name: { _eq: "bchn" } } }
          timestamp: { _gt: "1609459200", _lt: "1617249600" }
        }
      }
    }
  ) {
    aggregate {
      count
      max { size_bytes }
      min { size_bytes }
      avg { size_bytes }
      sum { size_bytes }
    }
  }
}`,
    subscribes: false,
    mock: `{
  "data": {
    "transaction_aggregate": {
      "aggregate": {
        "count": 24739821,
        "max": {
          "size_bytes": 99972
        },
        "min": {
          "size_bytes": 105
        },
        "avg": {
          "size_bytes": 318.3780765834967
        },
        "sum": {
          "size_bytes": 7876616625
        }
      }
    }
  }
}`,
  },
];
