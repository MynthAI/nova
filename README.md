# nova

**nova** is a Node.js CLI tool for easily interacting with stablecoins.
It provides simple commands to check balance, send, receive, withdraw,
and share funds via claim links.

## ✨ Features

- 🪙 Receive stablecoins
- 💰 Check balance
- 📤 Send stablecoins to anyone for free
- 🔗 Generate shareable claim links
- 📥 Withdraw stablecoins to external blockchains
- 🔐 Multiple authentication methods

## 🚀 Quick Start

Get up and running in under a minute:

### Option 1: Install from npm

``` bash
npm install @mynthai/nova
```

Or run directly without installing:

``` bash
npx @mynthai/nova --help
```

### Option 2: Build from source

``` bash
git clone https://github.com/MynthAI/nova.git
cd nova
pnpm install
pnpm build
pnpm link
```

Authenticate and start using Nova:

``` bash
nova login request you@example.com
nova login confirm 123456
nova balance
nova send 10 friend@example.com
```

Use `-h` or `--help` with any command to see detailed usage information.

## 📦 Installation

### Requirements

- Node.js **v24** (required)
- `pnpm` package manager (for building from source)

### Install from npm

``` bash
npm install @mynthai/nova
```

You can also run Nova directly with `npx` without installing it
globally:

``` bash
npx @mynthai/nova --help
```

### Install from source

Clone the repository and install dependencies:

``` bash
cd nova
pnpm install
pnpm build
pnpm link
```

After linking, the `nova` command will be available globally.

## 🔐 Authentication

Nova supports **two authentication methods**. You can choose the one
that best fits your workflow and security preferences.

### 1️⃣ Email-based Authentication (Recommended)

Authenticate using your email address. Nova creates and manages a wallet
for your account.

#### How it works

- You start login by requesting an authentication code to your email
- You confirm the code to complete login
- Nova securely manages your wallet
- You generate an authentication token for CLI access

#### Commands

``` bash
nova login request <email>
nova login confirm <code>
nova token
```

#### Best for

- New users
- Fast setup
- Users who don’t want to manage private keys

#### Pros

- Simple and beginner-friendly
- No manual key management
- Account recovery via email

#### Cons

- Requires trust in Nova for key management
- Email access is required

### 2️⃣ Private Key Authentication (Self-custody)

Authenticate by importing an existing wallet using a **private key** or
**mnemonic seed phrase**. All signing happens locally.

#### Commands

``` bash
nova import key
nova import phrase
```

#### Best for

- Advanced users
- Full self-custody
- Using an existing wallet

#### Pros

- Full control over your funds
- No email required
- Keys never leave your machine

#### Cons

- You are responsible for key security
- No recovery if keys are lost

⚠️ **Warning:** If you lose your private key or seed phrase, your funds
cannot be recovered.

### 🔄 Switching Authentication Methods

- Email-based accounts can export their wallet and move to self-custody
- Private-key accounts cannot be converted to email-based authentication

## 🚀 Usage

After building, the `nova` command will be available. The `nova` CLI
provides commands to manage your account, wallet, and transactions.

### General Syntax

``` bash
nova [options] [command]
```

Use `-h` or `--help` with any command to see detailed help.

### Commands

#### `login`

Login using your email address (non-interactive 2-step flow).

``` bash
nova login request <email>
nova login confirm <code>
```

**Commands**

- `request <email>` — Send an authentication code to the email address
- `confirm <code>` — Confirm the authentication code and complete login

#### `token`

Create an authentication token (email-based accounts only).

``` bash
nova token
```

#### `address`

Display your account address.

``` bash
nova address
```

#### `balance`

Show your current account balance.

``` bash
nova balance
```

#### `send`

Send funds to another Nova account or generate a claim link.

``` bash
nova send <amount> [destination]
```

**Arguments**

- `amount` — Amount to send
- `destination` *(optional)* — Recipient email or Nova account address

**Behavior**

- If `destination` **is provided**, funds are sent directly to that
  account
- If `destination` **is omitted**, Nova generates a **claim link**

``` bash
nova send 25
```

Example output:

``` text
Sent 25 to https://www.mynth.ai/c/MUhW0KzcB1BVxNRicamrRw
```

Anyone with the link can claim the funds. Once claimed, the link becomes
invalid.

#### Claim links

- Claim links represent a one-time transferable balance
- The first person to claim the link receives the funds
- Links can be shared via chat, email, or any messaging platform
- Unclaimed funds remain locked until claimed

⚠️ **Warning:** Anyone with access to the claim link can claim the
funds. Share links carefully.

#### `withdraw`

Withdraw funds to an external blockchain as a stablecoin.

``` bash
nova withdraw <amount> <stablecoin> <address> <blockchain>
```

**Arguments**

- `amount` — Amount to withdraw
- `stablecoin` — Stablecoin to withdraw as
- `address` — Destination blockchain address
- `blockchain` — Target blockchain (required if it cannot be inferred
  from the address)

#### `config`

Manage Nova configuration values.

``` bash
nova config get <key>
nova config set <key> <value>
```

#### `import`

Import an existing wallet.

``` bash
nova import key
nova import phrase
```

- `key` — Import wallet using a private key
- `phrase` — Import wallet using a mnemonic seed phrase

#### `export`

Export sensitive wallet data.

``` bash
nova export key
nova export phrase
```

- `key` — Export the wallet’s private key
- `phrase` — Export the wallet’s mnemonic seed phrase

⚠️ **Warning:** Exported data is highly sensitive. Store it securely.

## 🛠 Development

Lint the project:

``` bash
pnpm lint
```

Format code:

``` bash
pnpm prettier
```

Build the project:

``` bash
pnpm build
```

## 📄 License

This project is licensed under the terms of the **MIT License**. See the
`LICENSE` file for details.
