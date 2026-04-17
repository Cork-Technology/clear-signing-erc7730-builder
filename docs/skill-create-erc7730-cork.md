# Skill: `create-erc7730-cork` — ERC-7730 Clear Signing Descriptor Generator

## Metadata

- **Recommended base skill:** `generate-cork`
- **Why:** Format-file-driven document production pipeline with research gathering, context loading, review-board integration, and quality gating. The ERC-7730 creator needs the same pipeline shape: gather context (ABI, source, registry examples) → produce structured artifact (JSON) → review loop.
- **References:** `cork-context` (domain knowledge), `erc7730-patterns.md` (validation patterns)

---

## SKILL.md

```markdown
---
name: create-erc7730-cork
description: >
  Generate ERC-7730 clear signing descriptors for Cork Protocol smart contracts and EIP-712 messages.
  Produces registry-ready JSON validated against Ledger device constraints and Cork copywriting conventions.
  Supports both contract-context (function calls) and EIP-712 (typed messages) descriptors.
trigger: >
  Use when creating clear signing schemas, ERC-7730 descriptors, or registry files for Cork contracts.
  Triggers on: "create clear signing", "generate ERC-7730", "clear signing for [contract]",
  "make a descriptor for", "ERC-7730 schema for", "clear signing spec", "registry file for",
  "clear signing JSON", "write a descriptor". Also triggers when a contract ABI or EIP-712
  type definition is provided with intent to create a clear signing descriptor.
---

# create-erc7730-cork — ERC-7730 Clear Signing Descriptor Generator

## Domain Context

#include cork-context — Cork Protocol domain knowledge (terminology, products, token types, conventions)

Load cork-context for:
- **Token types:** cST (Cork Swap Token, internal, 18 decimals), cPT (Cork Principal Token, internal, 18 decimals), CA (Collateral Asset, external, variable decimals), REF (Reference Asset, external, variable decimals)
- **Product modules:** Cork Pool, Cork Phoenix, Cork Vaults, Protected Loops, Rollovers
- **Naming rules:** Always "cST"/"cPT" (lowercase c), never "CST"/"CPT". "Tokens" = Cork-minted. "Assets" = external
- **Team conventions:** Security-first, institutional tone, no CDS terminology in external content

## Review Patterns Reference

Load `references/erc7730-patterns.md` for the complete CS1–CS15 pattern library.
These patterns encode Baptiste's review feedback and Cork-specific conventions.

---

## Purpose

Generate complete, registry-ready ERC-7730 clear signing JSON descriptors for Cork Protocol
smart contracts and EIP-712 messages. The output must be directly submittable as a PR to
https://github.com/LedgerHQ/clear-signing-erc7730-registry.

---

## Step 0 — Gather Inputs

Collect all required context. For each input, try sources in priority order. Ask the user only for what you cannot obtain automatically.

### 0.1 Contract ABI (REQUIRED)
**Sources (in priority order):**
1. User-provided (pasted JSON, file path, or loaded from the builder app)
2. GitHub repo browse — user provides repo URL, browse to the ABI/artifact file
3. Etherscan V2 API — `https://api.etherscan.io/v2/api?chainid={id}&module=contract&action=getabi&address={addr}`
4. For EIP-712: the typed data schema (primaryType + types map), user-provided

**Validation:** Must be a valid JSON array. Each entry must have a `type` field. Filter to function-type entries for display generation.

### 0.2 Deployment Info (REQUIRED)
**Gather:**
- Chain ID(s) — Cork deploys to Ethereum (1), Arbitrum (42161), Base (8453), and potentially others
- Contract address(es) — one per chain deployment

**Ask the user** if not derivable from the ABI source or context.

### 0.3 Contract Source Code (RECOMMENDED)
**Why:** Understanding function semantics beyond ABI parameter names is critical for writing accurate intents.
**Sources:**
1. GitHub repo — user provides Cork Phoenix repo URL or specific contract path
2. Verified Etherscan source — fetch from explorer if contract is verified

**If unavailable:** Proceed but flag that intent accuracy depends on ABI names only, which may be imprecise.

### 0.4 Existing Cork ERC-7730 Files (RECOMMENDED)
**Why:** Consistency with existing Cork descriptors in the registry — copywriting tone, shared intents, include patterns.
**Source:** https://github.com/LedgerHQ/clear-signing-erc7730-registry — browse for cork-related files in registry/ directory.
**If unavailable:** Proceed using Cork conventions from cork-context and erc7730-patterns.md.

### 0.5 Contract Module Identification
**Determine which Cork module this contract belongs to:**
- Cork Pool (core primitive) — swap, exercise, redeem, deposit/provide liquidity
- Cork Vaults (ERC-4626) — deposit, withdraw, curator/manager functions
- Protected Loops — loop, deloop, self-liquidation
- Rollovers / Periphery — rollover, limit order functions
- Governance / Admin — timelock, access control, parameter changes

**Why this matters:** Module context determines appropriate intent language, which fields are "critical" (required), and which Cork-specific patterns apply.

---

## Step 1 — Classify Functions

For every function in the ABI, assign one classification:

| Category | Display? | Criteria | Examples |
|----------|----------|----------|---------|
| **User-facing write** | MUST | Non-view, non-pure functions callable by end users or vaults | `swap`, `exercise`, `redeem`, `deposit`, `withdraw`, `approve`, `permit` |
| **Admin/governance write** | MUST | Functions callable by admin multisig, timelock, or governance | `pause`, `unpause`, `setFee`, `setExchangeRateSpread`, `grantRole`, `revokeRole`, `upgradeToAndCall` |
| **Destructive/irreversible** | MUST + WARNING | Functions that permanently change state with no undo | `renounceOwnership`, `renounceRole`, `selfdestruct` |
| **View/pure** | SKIP | Read-only functions — never signed as transactions | `balanceOf`, `getReserves`, `totalSupply`, `owner`, `paused` |
| **Internal callback** | SKIP | Functions that revert when called directly by EOAs | Hooks, callbacks, internal routing functions |
| **Covered by includes** | SKIP | Standard OZ functions already in `common-ownership.json` or similar | `transferOwnership` if using includes |

**For EIP-712:** Classify each primaryType. User-facing message types (permits, limit orders, rollover offers) get display. Internal/system types skip.

**Output:** A classification table showing every function and its category. Present to user for confirmation before proceeding.

---

## Step 2 — Generate Descriptor Skeleton

### 2.1 Schema Reference
```json
{
  "$schema": "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json"
}
```

### 2.2 Context Block

**For contract-context:**
```json
{
  "context": {
    "$id": "cork-[module]-[contract-name]",
    "contract": {
      "deployments": [
        { "chainId": 1, "address": "0x..." }
      ],
      "abi": [ /* Only include ABI entries for functions that have display formats */ ]
    }
  }
}
```

**For EIP-712 context:**
```json
{
  "context": {
    "$id": "cork-[module]-[message-type]",
    "eip712": {
      "deployments": [
        { "chainId": 1, "address": "0x..." }
      ],
      "domain": {
        "name": "Cork Protocol",
        "version": "1",
        "verifyingContract": "0x..."
      },
      "schemas": [ { "primaryType": "...", "types": { ... } } ]
    }
  }
}
```

**Rules:**
- Only include ABI entries for functions that will have display format entries
- If the contract uses a factory pattern, include `factory` with `deployments` and `deployEvent`
- If using includes (e.g., `common-ownership.json`), add the `includes` field at root level

### 2.3 Metadata Block
```json
{
  "metadata": {
    "owner": "Cork Protocol",
    "info": {
      "legalName": "Cork Protocol",
      "url": "https://cork.technology"
    }
  }
}
```

**Additional metadata fields (add when needed):**
- `token`: For token contracts — include `name`, `ticker`, `decimals`
- `constants`: For values referenceable in fields via `$.metadata.constants.NAME`
- `enums`: For human-readable enum mappings (e.g., `{ "0": "Pending", "1": "Active" }`)

---

## Step 3 — Generate Field Formats

For each classified function that needs display, generate a format entry.

### 3.1 Function Key
The key in `display.formats` is the function signature: `functionName(type1,type2,...)`
- Use canonical Solidity types: `uint256` not `uint`, `address` not `addr`
- Tuples expand to `(type1,type2)`, array of tuples to `(type1,type2)[]`

### 3.2 Intent (CRITICAL — user sees this on device title screen)

**Rules:**
- Capitalize first letter: "Swap cST for collateral" not "swap cST for collateral"
- Use Cork terminology from cork-context: "cST", "cPT" (lowercase c, always)
- Match contract semantics: if the contract calls it `exercise`, intent says "Exercise..."
- Be specific and descriptive:
  - GOOD: "Exercise cST to receive collateral"
  - BAD: "Exercise" (too vague)
  - BAD: "exercise cST" (not capitalized)
- No trailing spaces
- Must fit title screen: ~42 chars for Ledger Flex, ~34 chars for Ledger Stax (2 lines)
  - If longer, the text wraps — still acceptable but check readability

**Cork-specific intent patterns:**
- Paired exact-in/exact-out functions (e.g., `exercise`/`exerciseOther`): use the SAME intent
- Timelock `schedule` and `execute` for the same operation: same intent but prefix with "Schedule: " or "Execute: "
- `unwindSwap` and `unwindExercise`/`unwindExerciseOther`: share "Repurchase" intent (confirmed by Baptiste)
- Destructive functions: intent must include "Permanently" or similar irreversibility warning

### 3.3 Fields

For each function parameter, determine:

#### Label (max 20 characters)
- Sentence case: "Receiver of collateral" not "Receiver Of Collateral"
- Specific, not generic:
  - "Receiver" alone is too vague → "Receiver of collateral" or "Receiver of cPT"
  - "Amount" alone is ambiguous → "cST amount" or "Collateral amount"
- Use "and" not "+": "cPT and cST amounts" not "cPT+cST"
- If label exceeds 20 chars, it will be truncated with "..." — rephrase to fit
  - Check truncation: `label.slice(0, 17) + "..."` — is the truncated version still meaningful?

#### Format (based on Solidity type + parameter name semantics)

| Solidity Type | Parameter Name Contains | Format | Params |
|---------------|------------------------|--------|--------|
| `uint256` | "amount", "value", "price" | See token amount rules below | — |
| `uint256` | "deadline", "expiration", "until", "timestamp" | `date` | `{ "encoding": "timestamp" }` |
| `uint256` | "duration" | `duration` | none |
| `uint256` | "height" | `date` | `{ "encoding": "blockheight" }` |
| `uint256` | (other: nonce, id, etc.) | `raw` | none |
| `address` | "token", "asset" | `addressName` | `{ "types": ["token"] }` |
| `address` | "collection", "nft" | `addressName` | `{ "types": ["collection"] }` |
| `address` | "spender" | `addressName` | `{ "types": ["contract"] }` |
| `address` | "from", "to", "owner", "recipient", "receiver" | `addressName` | `{ "types": ["eoa", "wallet"] }` |
| `address` | (other) | `addressName` | `{ "types": ["wallet", "eoa", "contract", "token", "collection"] }` |
| `bytes` | "calldata" | `calldata` | `{ "calleePath": "path.to.callee" }` or `{ "callee": "0x..." }` |
| `bytes` | (other) | `raw` | none |
| `bool`, `string` | — | `raw` | none |
| tuple/struct | — | Use `InputNestedFields` | Recursively apply format rules to components |
| array (`[]`) | — | Append `.[]` to path | Apply element type rules |

#### Cork-specific token amount rules (CRITICAL — from CS5 pattern + Baptiste feedback)

| Token Type | Format | Reasoning |
|------------|--------|-----------|
| cST amounts | `tokenAmount` | Cork-minted, known 18 decimals |
| cPT amounts | `tokenAmount` | Cork-minted, known 18 decimals |
| CA (collateral asset) amounts | `tokenAmount` IF token address is available in calldata (use `tokenPath`) | External token, variable decimals — need path to resolve |
| CA amounts | `raw` IF no token address in calldata context | Safer than guessing decimals |
| REF (reference asset) amounts | Same logic as CA | External token, variable decimals |
| Native ETH amounts | `amount` | Native currency, always 18 decimals |

**`tokenAmount` params (MUST have one of tokenPath or token):**
```json
{
  "tokenPath": "path.to.token.address",
  "nativeCurrencyAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "threshold": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  "message": "Unlimited"
}
```
- `tokenPath`: JSON path to the token address parameter in the same function call
- `nativeCurrencyAddress`: Address(es) that should be interpreted as native currency (ETH)
- `threshold` + `message`: For approve() unlimited patterns — show "Unlimited" instead of max uint256

#### Params validation
- `tokenAmount`: MUST have `tokenPath` or `token` — error if neither
- `addressName`: MUST have `types` array — at minimum one entry
- `date`: MUST have `encoding` — either "timestamp" or "blockheight"
- `calldata`: MUST have `calleePath` or `callee`
- `nftName`: MUST have `collectionPath` or `collection`
- `unit`: MUST have `base`
- `enum`: MUST have `$ref` pointing to `$.metadata.enums.ENUM_NAME`

### 3.4 Required Fields

Mark fields that users MUST see on the device:
- Recipient/receiver addresses — always required
- Token amounts — always required
- Deadline/expiry timestamps — required for time-sensitive operations
- Spender addresses in approve/permit — required

### 3.5 Excluded Fields

Fields that add noise:
- Internal nonces
- Routing parameters that users don't control
- Zero-value padding fields
- Permit signatures (bytes)

**Never exclude:** amounts, recipients, deadlines, or any field that changes the economic outcome.

---

## Step 4 — Apply Cork-Specific Patterns

### 4.1 Includes for Standard Patterns
If the contract inherits OpenZeppelin patterns:
- `grantRole`, `revokeRole`, `renounceRole` → use `common-access-control.json` include
- `transferOwnership`, `renounceOwnership` → use `common-ownership.json` include
- `upgradeToAndCall` → use `common-upgradeable.json` include

Add at root level:
```json
{
  "includes": "common-ownership.json"
}
```

### 4.2 Paired Function Intents
Cork contracts frequently have paired functions for the same operation:
- `exercise(uint256 amount)` / `exerciseOther(uint256 amount)` → same intent
- `swap(...)` / `swapExact(...)` → same intent
- `unwindSwap(...)` / `unwindExercise(...)` / `unwindExerciseOther(...)` → all share "Repurchase" intent

### 4.3 Timelock Patterns
For contracts behind a timelock:
- `schedule(...)` and `execute(...)` operate on the same data
- Both MUST use identical field formats
- If `execute` uses `calldata` format with `calleePath`, `schedule` must too (CS6)

### 4.4 Approval Patterns
For `approve(address spender, uint256 amount)`:
```json
{
  "intent": "Approve token spending",
  "fields": [
    {
      "path": "spender",
      "label": "Spender contract",
      "format": "addressName",
      "params": { "types": ["contract"] }
    },
    {
      "path": "amount",
      "label": "Amount",
      "format": "tokenAmount",
      "params": {
        "tokenPath": "$.context.contract.deployments[0].address",
        "threshold": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        "message": "Unlimited"
      }
    }
  ],
  "required": ["spender", "amount"]
}
```

---

## Step 5 — Validate

Run ALL of these checks before presenting the output. Report each as PASS/WARN/FAIL.

### 5.1 Structural Checks
| # | Check | Severity |
|---|-------|----------|
| V1 | `$schema` field present and points to valid spec URL | WARN |
| V2 | Context has ≥1 deployment with valid chainId + 0x address | FAIL |
| V3 | ABI present and parseable | FAIL |
| V4 | Every key in `display.formats` has a matching ABI function | FAIL |
| V5 | Every `path` in fields matches an ABI parameter name | FAIL |
| V6 | Every `required` entry references a valid path | FAIL |
| V7 | No null or undefined values in the JSON | WARN |
| V8 | No empty `"sources": []` or `"params": {}` | WARN |
| V9 | `metadata.owner` and `metadata.info` present | WARN |
| V10 | JSON ends with trailing newline | WARN |

### 5.2 Completeness Checks
| # | Check | Severity |
|---|-------|----------|
| V11 | Every user-facing write function has a display entry | FAIL |
| V12 | Every destructive function has a display entry with warning intent | FAIL |
| V13 | Every admin parameter-changing function has a display entry | WARN |

### 5.3 Device Constraint Checks
| # | Check | Severity |
|---|-------|----------|
| V14 | All labels ≤ 20 characters | WARN (show truncated preview) |
| V15 | No function has > 8 screens (> 18 included fields) | WARN |
| V16 | Intent text fits title screen (~42 chars Flex, ~34 chars Stax) | WARN |

### 5.4 Cork Convention Checks
| # | Check | Severity |
|---|-------|----------|
| V17 | cST/cPT always lowercase c | FAIL |
| V18 | Token vs Asset terminology correct | WARN |
| V19 | Intent capitalized, no trailing spaces | WARN |
| V20 | Labels use sentence case | WARN |
| V21 | Cork token amounts use `tokenAmount` not `raw` | WARN |

### 5.5 Format Param Checks
| # | Check | Severity |
|---|-------|----------|
| V22 | Every `tokenAmount` has `tokenPath` or `token` | FAIL |
| V23 | Every `date` has `encoding` | FAIL |
| V24 | Every `addressName` has `types` | WARN |
| V25 | Every `calldata` has `calleePath` or `callee` | FAIL |

---

## Step 6 — Review Loop

After validation passes (no FAIL results):

1. Invoke **review-board** with:
   - The generated ERC-7730 JSON
   - The ABI
   - Contract source code (if available)
   - The `erc7730-patterns.md` reference as review criteria

2. Review-board checks against CS1–CS15 patterns

3. If Critical (🔴) or High (🟠) findings:
   - Fix each finding
   - Re-validate (Step 5)
   - Re-review until clean

4. Medium (🟡) and Info (🔵) findings: present to user for decision — fix or accept.

---

## Output

Present the final output in this order:

### 1. Complete ERC-7730 JSON
- Formatted with 2-space indentation
- Trailing newline
- Ready to save as a `.json` file

### 2. Validation Summary
```
## Validation
V1  $schema present               PASS
V2  Deployments valid              PASS
...
V25 calldata params complete       PASS
```

### 3. Device Preview Summary
```
## Device Screens
| Function           | Fields | Screens | Truncated Labels |
|--------------------|--------|---------|------------------|
| swap(uint256,...)  | 5      | 4       | none             |
| exercise(uint256)  | 3      | 3       | none             |
| approve(addr,u256) | 2      | 3       | none             |
```

### 4. Suggested PR Description
For submitting to the LedgerHQ registry:
```markdown
## Summary
- Add clear signing descriptors for Cork Protocol [module name]
- Contract: [name] deployed on [chains]
- N functions covered, N screens total

## Checklist
- [ ] ABI alignment verified
- [ ] Device constraints checked (all labels ≤ 20 chars)
- [ ] Cork conventions applied (cST/cPT casing, terminology)
- [ ] Review-board pass (no Critical/High findings)
```
```

---

## Directory Structure

```
~/.claude/skills/create-erc7730-cork/
  SKILL.md                          <- the skill prompt above
  references/
    erc7730-patterns.md             <- copy from review-pr-cork/references/
    device-constraints.md           <- extracted from builder's src/lib/device-constraints.ts
```
