# Solidity vs Rust: Syntax Comparison

This guide compares smart contract syntax and patterns between Solidity and Rust.

Rust examples in this guide target Anchor on Solana unless explicitly labeled as Native Solana.

---

## Table of Contents

1. [Types](#types)
2. [Functions](#functions)
3. [Error Handling](#error-handling)
4. [Events & Logs](#events--logs)
5. [Storage Patterns](#storage-patterns)
6. [Common Operations](#common-operations)
7. [Deploy & Test Commands](#deploy--test-commands)

---

## Types

### Basic Types

| Operation            | Solidity                        | Rust                                             |
| -------------------- | ------------------------------- | ------------------------------------------------ |
| **Unsigned Integer** | `uint256 x = 10;`               | `let x: u64 = 10;`                               |
| **Signed Integer**   | `int256 x = -10;`               | `let x: i64 = -10;`                              |
| **Boolean**          | `bool isActive = true;`         | `let is_active: bool = true;`                    |
| **String**           | `string memory text = "hello";` | `let text: String = "hello".to_string();`        |
| **Address**          | `address wallet = 0x123...;`    | `let pubkey: Pubkey = Pubkey::from_str("...")?;` |
| **Bytes**            | `bytes32 hash;`                 | `let hash: [u8; 32] = [0; 32];`                  |

### Complex Types

**Solidity - Structs:**

```solidity
struct User {
    address wallet;
    uint256 balance;
    bool active;
}
```

**Rust - Structs:**

```rust
#[derive(Debug, Clone)]
pub struct User {
    pub wallet: Pubkey,
    pub balance: u64,
    pub active: bool,
}
```

**Solidity - Arrays & Mappings:**

```solidity
uint256[] public balances;
mapping(address => uint256) public userBalances;
mapping(address => mapping(address => uint256)) public allowances;
```

**Rust - Vectors (in-memory) & PDA Accounts (mapping equivalent):**

```rust
// In-memory collection inside a single instruction (not persistent state)
let mut balances: Vec<u64> = Vec::new();

// Mapping-like persistent state on Solana uses PDA-derived accounts.
#[account]
pub struct UserBalance {
    pub owner: Pubkey,
    pub balance: u64,
}

#[derive(Accounts)]
pub struct UpsertUserBalance<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 32 + 8,
        seeds = [b"user-balance", signer.key().as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

---

## Functions

### Function Declaration

**Solidity:**

```solidity
// Public function
function transfer(address to, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    balances[msg.sender] -= amount;
    balances[to] += amount;
    return true;
}

// View function (read-only)
function getBalance(address user) public view returns (uint256) {
    return balances[user];
}

// Internal function
function _validateAmount(uint256 amount) internal pure {
    require(amount > 0, "Amount must be positive");
}
```

**Rust (Anchor on Solana):**

```rust
pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
    require!(amount > 0, CustomError::InvalidAmount);

    let from = &ctx.accounts.from;
    let to = &ctx.accounts.to;

    require!(
        **from.to_account_info().lamports.borrow() >= amount,
        CustomError::InsufficientBalance
    );

    **from.to_account_info().try_borrow_mut_lamports()? -= amount;
    **to.to_account_info().try_borrow_mut_lamports()? += amount;

    Ok(())
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: SystemAccount<'info>,
}

// Helper function
fn validate_amount(amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(CustomError::InvalidAmount);
    }
    Ok(())
}

#[error_code]
pub enum CustomError {
    #[msg("Amount must be positive")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}
```

### Function Visibility

| Visibility   | Solidity                          | Rust                               |
| ------------ | --------------------------------- | ---------------------------------- |
| **Public**   | `public` - callable from anywhere | Functions exported from module     |
| **Internal** | `internal` - only within contract | Functions marked with `pub(crate)` |
| **Private**  | `private` - only in the contract  | Functions without `pub`            |
| **External** | `external` - only from outside    | N/A (use public)                   |

---

## Error Handling

### Solidity Error Handling

```solidity
// Using require
require(amount > 0, "Amount must be positive");

// Using assert
assert(balance >= amount);

// Using revert
if (amount > balance) {
    revert("Insufficient balance");
}

// Custom errors (Solidity 0.8.4+)
error InsufficientBalance(uint256 available, uint256 required);

function withdraw(uint256 amount) public {
    if (amount > balance) {
        revert InsufficientBalance(balance, amount);
    }
}
```

### Rust Error Handling (Anchor)

```rust
// Using custom errors
#[error_code]
pub enum TokenError {
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Amount must be positive")]
    InvalidAmount,
    #[msg("Unauthorized")]
    Unauthorized,
}

fn validate_amount(amount: u64) -> Result<()> {
    require!(amount > 0, TokenError::InvalidAmount);
    Ok(())
}

// Using require! and the ? operator
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    validate_amount(amount)?; // Early return on error

    let vault = &mut ctx.accounts.vault;
    require!(vault.balance >= amount, TokenError::InsufficientBalance);

    vault.balance -= amount;
    Ok(())
}
```

---

## Events & Logs

### Solidity Events

```solidity
// Event declaration
event Transfer(address indexed from, address indexed to, uint256 amount);
event Approval(address indexed owner, address indexed spender, uint256 amount);

// Emitting events
function transfer(address to, uint256 amount) public {
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transfer(msg.sender, to, amount);
}

function approve(address spender, uint256 amount) public {
    allowances[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
}
```

### Rust Logging (Anchor and Native Solana)

```rust
// Native Solana logging
msg!("Transfer initiated from {:?} to {:?}", from, to);

// Anchor events
#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

// In instruction handler
emit!(TransferEvent {
    from: ctx.accounts.from.key(),
    to: ctx.accounts.to.key(),
    amount: 100,
});

// Or using direct logging
msg!("Transfer: from={}, to={}, amount={}", from, to, 100);
```

---

## Storage Patterns

### Solidity State Variables

```solidity
// Contract storage
contract Token {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    uint256 public totalSupply;
    address public owner;

    constructor() {
        owner = msg.sender;
        totalSupply = 1000000 * 10**18;
        balances[msg.sender] = totalSupply;
    }
}
```

### Rust Account Data (Solana)

```rust
// Using Anchor framework
use anchor_lang::prelude::*;

#[account]
pub struct TokenAccount {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub balance: u64,
    pub delegate: Option<Pubkey>,
    pub delegated_amount: u64,
    pub is_frozen: bool,
}

// Initializing account
pub fn initialize_account(
    ctx: Context<InitializeAccount>,
) -> Result<()> {
    let account = &mut ctx.accounts.token_account;
    account.mint = ctx.accounts.mint.key();
    account.owner = ctx.accounts.owner.key();
    account.balance = 0;
    Ok(())
}

// Custom PDA (Program Derived Address)
#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub bump: u8,
}

// Creating PDA
let (vault_pda, bump) = Pubkey::find_program_address(
    &[b"vault", authority.as_ref()],
    &program_id,
);
```

### Storage Cost Comparison

| Aspect               | Solidity                           | Rust (Solana)                                              |
| -------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **Cost Model**       | Gas per operation                  | Compute + account storage allocation                       |
| **Storage Payment**  | One-time deployment                | One-time rent-exempt deposit (refundable on account close) |
| **Data Persistence** | Permanent (contract owner pays)    | Persistent while account stays allocated                   |
| **Mutable State**    | Implicit in contract storage slots | Must pass writable accounts                                |

---

## Common Operations

### Token Transfer

**Solidity (ERC-20):**

```solidity
function transfer(address to, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount, "Insufficient balance");

    balances[msg.sender] -= amount;
    balances[to] += amount;

    emit Transfer(msg.sender, to, amount);
    return true;
}
```

**Rust (SPL Token):**

```rust
pub fn transfer(
    ctx: Context<Transfer>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, "Amount must be greater than zero");

    let mut from_account = ctx.accounts.from_token_account.load_mut()?;
    let mut to_account = ctx.accounts.to_token_account.load_mut()?;

    require!(from_account.amount >= amount, "Insufficient balance");

    from_account.amount -= amount;
    to_account.amount += amount;

    emit!(TransferEvent {
        from: ctx.accounts.from_token_account.key(),
        to: ctx.accounts.to_token_account.key(),
        amount,
    });

    Ok(())
}
```

### Check Balance

**Solidity:**

```solidity
function balanceOf(address account) public view returns (uint256) {
    return balances[account];
}

// Usage
uint256 myBalance = token.balanceOf(msg.sender);
```

**Rust:**

```rust
pub fn get_balance(ctx: Context<GetBalance>) -> Result<u64> {
    let account = &ctx.accounts.token_account.load()?;
    Ok(account.amount)
}

// Usage
let balance = get_balance(&client, token_account)?;
```

### Approval & TransferFrom

**Solidity:**

```solidity
function approve(address spender, uint256 amount) public returns (bool) {
    allowances[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
}

function transferFrom(
    address from,
    address to,
    uint256 amount
) public returns (bool) {
    require(balances[from] >= amount, "Insufficient balance");
    require(allowances[from][msg.sender] >= amount, "Allowance exceeded");

    balances[from] -= amount;
    balances[to] += amount;
    allowances[from][msg.sender] -= amount;

    emit Transfer(from, to, amount);
    return true;
}
```

**Rust:**

```rust
pub fn approve(
    ctx: Context<Approve>,
    amount: u64,
) -> Result<()> {
    let delegate = &mut ctx.accounts.delegate;
    delegate.delegated_amount = amount;

    emit!(ApprovalEvent {
        owner: ctx.accounts.owner.key(),
        spender: ctx.accounts.spender.key(),
        amount,
    });

    Ok(())
}

pub fn transfer_from(
    ctx: Context<TransferFrom>,
    amount: u64,
) -> Result<()> {
    require!(
        ctx.accounts.delegate.delegated_amount >= amount,
        "Allowance exceeded"
    );

    // Perform transfer
    ctx.accounts.delegate.delegated_amount -= amount;

    Ok(())
}
```

---

## Deploy & Test Commands

### Solidity (Hardhat)

**1. Setup:**

```bash
npm install --save-dev hardhat
npx hardhat init
npm install @openzeppelin/contracts
```

**2. Compile:**

```bash
npx hardhat compile
```

**3. Deploy:**

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**4. Test:**

```bash
npx hardhat test
npx hardhat test test/Token.test.js --grep "transfer"
```

**5. Deploy to Testnet:**

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Example Test:**

```javascript
describe("Token", function () {
  it("Should transfer tokens", async function () {
    const { token, addr1, addr2 } = await loadFixture(deployToken);

    await token.transfer(addr1.address, 100);
    expect(await token.balanceOf(addr1.address)).to.equal(100);
  });
});
```

### Rust (Anchor on Solana)

**1. Setup:**

```bash
cargo install anchor-cli
anchor init my_program
cd my_program
```

**2. Build:**

```bash
anchor build
```

**3. Deploy (Local):**

```bash
solana config set --url localhost
solana-test-validator
anchor deploy
```

**4. Test:**

```bash
anchor test
anchor test --skip-local-validator
```

**5. Deploy to Devnet:**

```bash
solana config set --url devnet
anchor deploy
```

**Example Test (TypeScript/Mocha, standard Anchor flow):**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { MyProgram } from "../target/types/my_program";

describe("my_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProgram as Program<MyProgram>;

  it("executes transfer instruction", async () => {
    const tx = await program.methods
      .transfer(new anchor.BN(100))
      .accounts({
        from: provider.wallet.publicKey,
        to: provider.wallet.publicKey,
      })
      .rpc();

    expect(tx).to.be.a("string");
  });
});
```

### Key Deployment Differences

| Aspect                  | Solidity                | Rust (Solana)                                                       |
| ----------------------- | ----------------------- | ------------------------------------------------------------------- |
| **Compilation**         | `solc` compiler         | `cargo build`                                                       |
| **Bytecode Format**     | EVM opcodes             | SBF (eBPF-derived)                                                  |
| **Storage**             | Contract state          | Account data                                                        |
| **Upgrades**            | Proxy pattern           | Native upgrade authority (BPF Loader Upgradeable), `anchor upgrade` |
| **Testing Environment** | Hardhat, Truffle        | Anchor, solana-test-validator, Surfpool                             |
| **Local Testing**       | Hardhat node            | solana-test-validator, Surfpool                                     |
| **Network Tokens**      | Testnet ETH from faucet | Devnet SOL from airdrop                                             |

---

## Quick Reference Table

| Task                  | Solidity                   | Rust                           |
| --------------------- | -------------------------- | ------------------------------ |
| **Check balance**     | `balances[addr]`           | `account.load()?.amount`       |
| **Transfer**          | `balances[from] -= amount` | Modify account state           |
| **Emit event**        | `emit Transfer(...)`       | `emit!(Event {...})`           |
| **Require condition** | `require(cond, msg)`       | `require!(cond, err_msg)`      |
| **Get caller**        | `msg.sender`               | `ctx.accounts.signer.key()`    |
| **Access time**       | `block.timestamp`          | `Clock::get()?.unix_timestamp` |
| **Revert**            | `revert("msg")`            | `return Err(Error)`            |
| **Storage**           | State variables            | Account data                   |

---

## Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Anchor Errors (require!, custom errors)](https://www.anchor-lang.com/docs/features/errors)
- [Anchor Account Constraints](https://www.anchor-lang.com/docs/references/account-constraints)
- [Solana Accounts](https://solana.com/docs/core/accounts)
- [Solana Program Deployment and Upgrades](https://solana.com/docs/programs/deploying)
- [Solana Documentation](https://solana.com/docs)
- [ERC-20 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
- [SPL Token Program](https://www.solana-program.com/docs/token)
