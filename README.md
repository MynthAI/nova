# nova

**nova** is a Node.js CLI tool for easily interacting with stablecoins.
It provides simple commands to check balance, send and withdraw.

## ✨ Features

- 🪙 Receive stablecoins
- 💰 Check balance
- 📤 Send stablecoins to anyone for free
- 📥 Withdraw stablecoin to external blockchain

## 📦 Installation

> **Requirements**

- Node.js **v24** (required)
- `pnpm` package manager

Clone the repository and install dependencies:

``` bash
cd nova
pnpm install
pnpm link
```

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

Login using your email address.

``` bash
nova login <email>
```

**Arguments**

- `email` — Email address to log in with

#### `token`

Create an authentication token after logging in.

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

Send balance to another Nova account.

``` bash
nova send <amount> <destination>
```

**Arguments**

- `amount` — Amount to send
- `destination` — Recipient email or Nova account address

#### `withdraw`

Withdraw balance to an external blockchain as a stablecoin.

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
