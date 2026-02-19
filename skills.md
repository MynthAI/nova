# skills.md — nova CLI (LLM)

## Deterministic Parsing (MUST)

- Use structured output: `-j/--json` or `-t/--toon` (never parse human
  output).
- Always evaluate BOTH:
  - process exit code (`0` success, `1` error)
  - structured `status` (`ok` or `error`)
- On error: read `error.message` and `error.exitCode` (if present).

## Safety / Financial Safeguards (MUST)

- Before **any** financial action (`send`, `withdraw`):
  - Confirm current network via `nova config get network`.
  - Confirm intended network with user (mainnet vs testnet).
  - Confirm amount and destination/address (and blockchain for
    withdraw).
- `send` is **non-idempotent**:
  - Never retry `nova send` blindly.
  - If outcome is uncertain, verify via `nova -t balance` (safe).
- Treat `claimUrl` as a **secret credential**:
  - Never paste into shared chats/tickets/docs or persistent logs.
- Key material is **secret**:
  - Never log/export keys or phrases into shared/persistent contexts.
  - Warn user before `export` operations.

## Wallet Types

- Email wallet: created via `nova login` (email + verification code).
- Private-key wallet (default if not logged in): auto-created; user must
  back up:
  - `nova export key` OR `nova export phrase`.

## Networks

- `nova` operates on `mainnet` or `testnet`.
- Fresh install default: `testnet`.
- Network setting persists; funds/addresses/balances are isolated per
  network.

Commands:

``` bash
nova config get network
nova config set network <mainnet|testnet>
```

## Exit Codes

- `0` = success (still parse `status`).
- `1` = error (inspect `error.message`).

## Output Modes (for agents)

- JSON: `-j, --json`
- TOON: `-t, --toon`

## Commands (syntax preserved)

### Auth

Request login code:

``` bash
nova login request <email>
```

Confirm code:

``` bash
nova login confirm <code>
```

Options: - `-j, --json` - `-t, --toon` - `-f, --force` (request only):
overwrites existing private-key wallet; warn user.

### Account

Address:

``` bash
nova address [blockchain]
```

Default blockchain: `mynth`  
Supported blockchains: `base`, `cardano`, `hyperliquid`, `mynth`,
`plasma`, `solana`, `stable`, `sui`, `tron`

Balance:

``` bash
nova balance
```

Notes: - `balance` is USD-denominated. - `currency` is always USD.

### Send (FINAL ACTION)

``` bash
nova send <amount> [destination]
```

Behavior: - If `destination` omitted: creates claim link (`claimUrl`)
and funds leave wallet immediately. - If `destination` provided: sends
directly. Rules: - No interactive confirmation; no dry-run. -
Non-idempotent: re-running sends again. Post-check: - Parse `status` and
confirm `result.sent: true`. - Surface `result.txId` when present. - If
`claimUrl` present, treat as secret.

Success example (TOON):

``` bash
status: ok
result:
  sent: true
  amount: "1"
  txId: d32c966fd4302673455eb790b66e3efc331ef7aace412c73b8917ba0bb37ace8
  claimUrl: "https://preview.mynth.ai/c/mto3M1JEa6Hr0UFRCBGjOg"
```

### Claim Links

Properties (when `nova send <amount>` has no destination): - One-time
use. - Do not expire. - Revocation: creator must claim it themselves
(redeem back to own wallet).

### Withdraw (FINAL ACTION)

``` bash
nova withdraw <amount> <stablecoin> <address> <blockchain>
```

Rules: - Confirm: sufficient balance, network, stablecoin support,
address+blockchain compatibility. - Parse `status`; surface
`result.txId` when present. Verification (safe):

``` bash
nova -t balance
```

#### Stablecoin support (compact)

Mainnet: - base: USDC - cardano: USDC, USDA, USDM - hyperliquid: USDC -
solana: USDC, USDT - stable: USDT - sui: USDC - tron: USDT

Testnet: - base: USDC - cardano: USDC, USDA, USDM - hyperliquid: USDC -
solana: USDC - stable: USDT - sui: USDT - tron: USDT

### Fees

- Internal transfers / claim links: fee-free; recipient gets full
  amount.
- External withdrawals: may incur chain fees; fees are calculated at
  execution and deducted from withdrawal amount (not separate).

## Rate Limits

If rate-limited, structured output indicates an error and includes a
message like “Rate limited. Try again in N seconds”. Rules: - Do not
retry immediately; respect the wait time. - Never retry `send` blindly
after a rate-limit error. - If unsure whether `send` executed, verify
via `nova -t balance`.

Error example (TOON, insufficient balance):

``` bash
status: error
error:
  message: 3tkv5qrm43jtjf86x3ks5l6jpjgpyw7n8424pm must have at least balance of 1000000
  exitCode: 1
```

## Key Management (security-critical)

Export:

``` bash
nova export key
nova export phrase
```

Import:

``` bash
nova import key
nova import phrase
```

Rules: - Warn user: exporting reveals secrets. - Never store or share
exported key/phrase.
