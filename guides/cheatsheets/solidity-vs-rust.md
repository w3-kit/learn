# Solidity vs Rust: Syntax Comparison

This guide compares smart contract syntax and patterns between Solidity and Rust.

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

**Rust - Vectors & HashMaps:**

```rust
let mut balances: Vec<u64> = Vec::new();
let mut user_balances: HashMap<Pubkey, u64> = HashMap::new();
let mut allowances: HashMap<Pubkey, HashMap<Pubkey, u64>> = HashMap::new();
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

**Rust (Solana Program):**

```rust
// Instruction handler
pub fn transfer(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let from = &accounts[0];
    let to = &accounts[1];

    require!(from.is_signer, "From account must sign");

    // Transfer logic
    let mut from_balance = from.try_borrow_mut_data()?;
    let mut to_balance = to.try_borrow_mut_data()?;

    // Perform transfer
    Ok(())
}

// Helper function
fn validate_amount(amount: u64) -> Result<(), ProgramError> {
    if amount == 0 {
        return Err(ProgramError::InvalidArgument);
    }
    Ok(())
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

### Rust Error Handling

```rust
// Using Result type
fn withdraw(amount: u64) -> Result<(), ProgramError> {
    if amount > balance {
        return Err(ProgramError::InsufficientFunds);
    }
    Ok(())
}

// Using custom errors
#[derive(Debug)]
pub enum TokenError {
    InsufficientBalance,
    InvalidAmount,
    Unauthorized,
}

// Using the ? operator
fn transfer(amount: u64) -> Result<(), TokenError> {
    validate_amount(amount)?;  // Early return on error
    execute_transfer(amount)?;
    Ok(())
}

// Using macros (Anchor framework)
pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    require!(amount > 0, "Amount must be positive");
    require!(
        ctx.accounts.from.balance >= amount,
        "Insufficient balance"
    );
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

### Rust Logging (Solana)

```rust
// Using msg! macro
msg!("Transfer initiated from {:?} to {:?}", from, to);

// Emitting events with anchor
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

| Aspect               | Solidity                        | Rust (Solana)                      |
| -------------------- | ------------------------------- | ---------------------------------- |
| **Cost Model**       | Gas per operation               | Rent (storage) + Compute           |
| **Storage Payment**  | One-time deployment             | Annual rent (recovered on closure) |
| **Data Persistence** | Permanent (contract owner pays) | Rent-based (account owner pays)    |
| **Mutable State**    | Implicit in contract            | Must pass as mutable account       |

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

**Example Test:**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;

    #[tokio::test]
    async fn test_transfer() {
        let program = anchor_lang::prelude::Program::new(
            Id,
            anchor_client::Client::new(
                anchor_client::Cluster::Localnet,
                Rc::new(anchor_client::Wallet::new(
                    std::fs::read(
                        &shellexpand::tilde("~/.config/solana/id.json")
                    )?,
                )?),
                anchor_client::RequestBuilder::default(),
            ),
        );

        // Test logic here
    }
}
```

### Key Deployment Differences

| Aspect                  | Solidity                | Rust (Solana)                 |
| ----------------------- | ----------------------- | ----------------------------- |
| **Compilation**         | `solc` compiler         | `cargo build`                 |
| **Bytecode Format**     | EVM opcodes             | SBPF (eBPF)                   |
| **Storage**             | Contract state          | Account data                  |
| **Upgrades**            | Proxy pattern           | CRATES (Anchor) or ASDROP     |
| **Testing Environment** | Hardhat, Truffle        | Anchor, solana-test-validator |
| **Local Testing**       | Hardhat node            | solana-test-validator         |
| **Network Tokens**      | Testnet ETH from faucet | Devnet SOL from airdrop       |

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
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [ERC-20 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
- [SPL Token Documentation](https://spl.solana.com/token)
