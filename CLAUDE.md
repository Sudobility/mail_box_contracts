# mail_box_contracts — AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave work in the working tree. Run
> `git commit` / `git push` / `gh pr create` only when the user explicitly asks in that turn.
> Finishing a task is not permission to commit it. Stay on the current branch; do not create
> feature branches for code changes.

## What this is

Multi-chain decentralized messaging system, published as `@sudobility/contracts`
(v1.17.90, BUSL-1.1). Smart contracts on **EVM chains** (Ethereum, Polygon, Optimism, Base,
Arbitrum, Avalanche, BSC, + more) and **Solana**, plus a **unified TypeScript client**.
USDC-based fees, 90/10 revenue sharing with 60-day claim periods, delegation, and a
contract-to-wallet permission system.

- Package manager: **Bun**. Node >= 20.18.0.
- Two-tier fee model: Priority (payer pays full `sendFee`, receiver gets 90% claimable) vs
  Standard (payer pays 10% of `sendFee`, no revenue share). Delegation = flat 10 USDC.

## Stack / layout

- `contracts/` — EVM Solidity `^0.8.24`. `Mailer.sol` (UUPS upgradeable, OZ 5.4), `MockUSDC.sol`,
  `interfaces/`, `examples/`. Compiled via Hardhat → `artifacts/` + `typechain-types/` (ethers-v6).
- `programs/mailer/` — Solana program in **native Rust (NO Anchor)**, Borsh serialization,
  `solana-program` 1.16 / `spl-token` 3.5 / `borsh` 1.5. Program ID
  `9FLkBDGpZBcR8LMsQ7MwwV6X9P4TDFgN3DeRh5qYyHJF` (`declare_id!` in `src/lib.rs`).
- `src/` — TS client. Entry points (see `exports` in package.json):
  - `.` / `/web` → `OnchainMailerClient`, `WalletDetector`, unified types (`src/unified/`)
  - `/evm` → `EVMMailerClient`, `Mailer__factory` (ABI+bytecode), `Mailer` type (viem-based)
  - `/solana` → `SolanaMailerClient`, Solana types (@solana/web3.js, manual instruction building)
  - `/react` → `MailerProvider` + TanStack React Query hooks (`src/react/`)
  - `/react-native` + `/react-native/polyfills` → RN build with Buffer/URL/crypto polyfills
- `scripts/` — `evm/` (deploy, deploy-upgradeable, upgrade, verify), `solana/` (init-native,
  upgrade, manage-upgrade-authority), `unified/` (deploy-all).
- `test/` — `evm/` (Hardhat + chai) and `unified/` (mocha, run via a custom runner).
- Build output → `dist/` (unified + react-native TS targets). `deployments/` + `DEPLOYED.json`
  track deployed addresses.

## Commands (verified against package.json)

```bash
bun install

# Compile / build
bun run compile            # = compile:evm = npx hardhat compile (generates typechain-types/)
bun run build              # evm + solana + unified + react-native + scripts/fix-esm-imports.mjs
bun run build:solana       # cargo build (programs/mailer) + tsc — use this for Solana locally
bun run build:ci           # unified + react-native only (no contract compile)

# Tests — NOTE: there is NO `bun test` aggregate script. Use these:
bun run test:unit          # test:evm + test:unified:direct (EVM Hardhat + unified TS)
bun run test:evm           # Hardhat test test/evm/Mailer.test.ts (via tsx)
bun run test:solana        # cargo test in programs/mailer (needs Rust)
bun run test:unified:direct# node scripts/run-unified-tests.mjs
bun run test:ci            # build:unified + test:unified:direct

# Quality
bun run typecheck          # compile:evm + prettier typechain + tsc --noEmit
bun run lint               # eslint (flat config eslint.config.js; excludes examples/)
bun run format             # prettier
bun run lint:md            # markdownlint

# Deploy (EVM: one script per network, e.g.)
bun run deploy:evm:sepolia / :mainnet / :polygon / :base / :arbitrum / ... (30+ networks)
bun run verify:evm:<network>                 # Etherscan verification
npx hardhat run scripts/evm/deploy-upgradeable.ts --network <net>   # UUPS proxy deploy
PROXY_ADDRESS=0x... npx hardhat run scripts/evm/upgrade.ts --network <net>
```

> **Gotcha — Solana/Anchor mismatch:** `compile:solana` (`anchor build`),
> `deploy:solana:*` (`anchor deploy`) scripts call the **Anchor CLI**, but the program is
> native and there is **no `Anchor.toml`** — these will not work out of the box. The root
> `Cargo.toml` declares anchor deps at workspace level, but `programs/mailer` does not use
> them. Use `cargo` directly (`build:solana`, `test:solana`) and `scripts/solana/*.ts` for
> real work.

## Architecture / conventions

- **Stateless unified client.** `OnchainMailerClient` has no constructor config and stores no
  wallet. Every method takes `(wallet, chainInfo, ...)`. It lazy-loads `EVMMailerClient` or
  `SolanaMailerClient` via dynamic `import()` (keyed off `chainInfo.chainType`) and caches them
  as static props — this keeps both chain impls out of the bundle unless used, and is
  tree-shake / SSR / multi-tenant safe.
- **Wallet detection.** `WalletDetector.detectWalletType(wallet)` — Solana has
  `publicKey`+`signTransaction`; EVM has `address`+`request`. Also detects from address format.
- **EVM uses viem, not ethers.** ABI/bytecode come from the TypeChain-generated
  `Mailer__factory` (ethers-v6 target, but ABI is format-agnostic). ethers is only used in
  Hardhat tests. Gas estimation has a configurable multiplier (default 1.2x).
- **Soft-fail fee pattern (both chains).** `send*` operations do NOT revert / error on USDC fee
  payment failure (insufficient balance/approval). They still emit the event/log with
  `feePaid=false`, for composability with calling contracts.
- **UUPS upgradeable (EVM).** Contracts sit behind ERC1967 proxies; proxy address is stable,
  owner upgrades implementation via `_authorizeUpgrade`. **Never reorder/remove existing storage
  variables** — storage layout must be preserved across upgrades. `Mailer.sol` storage is
  gas-optimized (scalars packed into 2 slots; `ClaimableAmount` = uint192 + uint64 in 1 slot).
- **Permission system (EVM).** A wallet calls `setPermission(contractAddress)` so that contract
  can send messages with the wallet as `payer`. Tracked in `permissions[contract][wallet]`.
- **React hooks** are TanStack React Query v5. Prefer grouped hooks (`useFees()`,
  `useMessaging()`, `useClaims()`, `useDelegation()`, etc.) over the deprecated per-call hooks.
- **React Native**: import `@sudobility/contracts/react-native/polyfills` BEFORE anything else.
- **Solana state** is PDA accounts (seeds `b"mailer"`, `b"claim"`, `b"delegation"`, `b"discount"`,
  each with a `PDA_VERSION = 1` version byte). Instructions are the `MailerInstruction` Borsh enum.

## Common tasks

- **New EVM contract function:** edit `contracts/Mailer.sol` → `bun run compile` (regen
  typechain) → mirror in `src/evm/evm-mailer-client.ts` and `src/unified/onchain-mailer-client.ts`
  → add tests in `test/evm/Mailer.test.ts` → `bun run test:unit`.
- **New Solana instruction:** add variant to `MailerInstruction` in `programs/mailer/src/lib.rs`,
  wire into `process_instruction` → `bun run test:solana` → mirror in `src/solana/` and `src/unified/`.
- **Deploy to a new EVM chain:** add network to `hardhat.config.cts` (+ Etherscan key), add
  deploy/verify scripts to package.json, set `.env.local` (`EVM_PRIVATE_KEY`, `ALCHEMY_API_KEY`,
  RPC URLs), run deploy-upgradeable + verify, update `DEPLOYED.json` / `deployments/`.

## Config files

- `hardhat.config.cts` — multi-network Hardhat config (Alchemy RPCs, Etherscan verify).
  `hardhat.config.evm.cts` is a secondary variant.
- Multiple tsconfigs: `tsconfig.unified.json`, `.react-native.json`, `.evm.json`, `.solana.json`,
  `.test.json`, `.eslint.json` — each targets a specific build/lint step.
- `.env` / `.env.local` hold API keys + private keys (see `.env.example`). Never commit secrets.
