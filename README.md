# @sudobility/contracts

Multi-chain decentralized messaging system supporting EVM chains and Solana with USDC-based fees, revenue sharing, delegation management, and a unified TypeScript client. Uses a two-tier fee model (Priority and Standard) with a 90/10 revenue split and 60-day claim periods.

## Installation

```bash
bun add @sudobility/contracts
```

Peer dependencies: `viem` (>=2.0.0), `@solana/web3.js` (>=1.95.0), `@solana/spl-token` (>=0.4.0). Optional: `react`, `@tanstack/react-query` (for React hooks).

## Usage

```typescript
import { OnchainMailerClient, WalletDetector } from '@sudobility/contracts';
import { EVMMailerClient } from '@sudobility/contracts/evm';
import { SolanaMailerClient } from '@sudobility/contracts/solana';
import {
  MailerProvider,
  useFees,
  useMessaging,
} from '@sudobility/contracts/react';

// Unified client -- stateless, auto-detects chain type
const client = new OnchainMailerClient();

// Send a message (works on any chain)
await client.sendMessage(wallet, chainInfo, 'Subject', 'Body', {
  revenueShare: true,
});

// Delegate, claim revenue, manage fees
await client.delegateTo(wallet, chainInfo, delegateAddress);
await client.claimRevenue(wallet, chainInfo);
const fee = await client.getSendFee(chainInfo);
```

### React Integration

```tsx
import {
  MailerProvider,
  useMessaging,
  useFees,
} from '@sudobility/contracts/react';

function App() {
  return (
    <MailerProvider>
      <MessagingUI />
    </MailerProvider>
  );
}
```

### React Native

```typescript
import '@sudobility/contracts/react-native/polyfills'; // Must be first import
import { OnchainMailerClient } from '@sudobility/contracts/react-native';
```

## API

### Entry Points

| Import Path                          | Contents                                               |
| ------------------------------------ | ------------------------------------------------------ |
| `@sudobility/contracts`              | `OnchainMailerClient`, `WalletDetector`, unified types |
| `@sudobility/contracts/evm`          | `EVMMailerClient`, `Mailer__factory`, ABI              |
| `@sudobility/contracts/solana`       | `SolanaMailerClient`, Solana types                     |
| `@sudobility/contracts/react`        | `MailerProvider`, query hooks, mutation hooks          |
| `@sudobility/contracts/react-native` | Unified client + polyfills                             |

### Smart Contracts

- **EVM (Solidity 0.8.24)**: UUPS upgradeable proxy, soft-fail fee pattern, permission system for contract-to-wallet authorization
- **Solana (Rust, native)**: No Anchor, Borsh serialization, PDA-based state accounts

## Development

Prerequisites: [Bun](https://bun.sh) (package manager + task runner), Node >= 20.18.0. Building/testing the Solana program also requires a Rust toolchain (`cargo`).

```bash
bun install
bun run compile            # Compile EVM contracts (generates typechain-types/)
bun run build              # Build all targets (EVM + Solana + unified + react-native)

# Tests (there is no `bun test` aggregate script — use the scripts below):
bun run test:unit          # EVM (Hardhat) + unified TS tests
bun run test:solana        # Solana program tests (cargo test; needs Rust)
bun run test:evm           # EVM contract tests only

bun run typecheck          # TypeScript checking
bun run lint               # ESLint
bun run format             # Prettier
```

> Note: `compile:solana` / `deploy:solana` scripts invoke the Anchor CLI, but the Solana
> program is a **native** program (no Anchor, no `Anchor.toml`). For local work use
> `bun run build:solana` (cargo build) and `bun run test:solana` (cargo test).

### Deployment

```bash
bun run deploy:evm:sepolia        # Deploy to Sepolia
bun run deploy:evm:mainnet        # Deploy to Ethereum mainnet
bun run deploy:solana:devnet      # Deploy Solana program
bun run verify:evm:mainnet        # Etherscan verification
```

## Related Packages

- `@sudobility/configs` -- chain configuration, RPC helpers
- `@sudobility/types` -- shared types (Chain, ChainType)
- `@sudobility/mail_box_types` -- response types (MessageSendResponse, etc.)
- `@0xmail/indexer` -- blockchain indexer consuming contract events

## License

BUSL-1.1
