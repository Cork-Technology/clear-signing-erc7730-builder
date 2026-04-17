# ERC-7730 Clear Signing Builder

A Next.js web app that generates and edits ERC-7730 JSON descriptors for Ledger's clear signing initiative. Users input a smart contract ABI, then walk through a wizard to produce a human-readable transaction display schema that maps function parameters to labeled, formatted fields.

## Quick Reference

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Static export to out/
npm run check        # Lint + typecheck in one pass
npm run test         # Vitest unit tests
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint only
npm run lint:fix     # ESLint autofix
```

Path alias: `~/` maps to `src/`.

## What is ERC-7730?

ERC-7730 is a standard JSON format that tells hardware wallets (Ledger) how to display smart contract transactions in human-readable form. Instead of showing raw hex, the wallet shows labeled fields like "Recipient", "Amount", "Token". Each descriptor file maps contract function selectors to display rules.

The final output is a JSON file submitted as a PR to https://github.com/LedgerHQ/clear-signing-erc7730-registry.

## Architecture Overview

Static Next.js 15 app (App Router, `output: "export"`). No backend. State lives in Zustand stores persisted to sessionStorage.

### Wizard Flow (5 steps)

```
/ (Home)         -> Input ABI or load existing schema
/chains          -> Configure chain deployments (chainId + address)
/metadata        -> Set owner name, legal name, URL
/operations      -> Edit each function's display rules (intent, fields, formats)
/review          -> Select valid operations, export final JSON
```

### Dependency Graph

```
                    ┌─────────────────────┐
                    │     app/page.tsx     │  Home: ABI input / schema load
                    │  address-abi-form    │  GitHub repo browser
                    └─────────┬───────────┘
                              │ generates initial Erc7730 via
                              │ lib/generate-descriptor.ts
                              ▼
                    ┌─────────────────────┐
                    │  store/erc7730Store  │  Central state (Zustand + sessionStorage)
                    │  generatedErc7730   │  Working copy
                    │  finalErc7730       │  Clean copy (excluded fields removed)
                    └──┬──────┬───────┬───┘
                       │      │       │
          ┌────────────┘      │       └────────────┐
          ▼                   ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
│ chains/      │   │ metadata/        │   │ operations/  │
│ chainsForm   │   │ metaDataForm     │   │ editOperation│
│              │   │ devices          │   │ fieldForm    │
│ setDeployments│  │ setMetadata      │   │ fieldSelector│
└──────────────┘   └──────────────────┘   └──────┬───────┘
                                                  │ per-format forms:
                                                  ▼
                                          ┌──────────────────┐
                                          │ fields/          │
                                          │ rawFieldForm     │
                                          │ amountFieldForm  │
                                          │ tokenAmountForm  │
                                          │ addressNameForm  │
                                          │ nftNameFieldForm │
                                          │ dateFieldForm    │
                                          │ durationFieldForm│
                                          │ callDataFieldForm│
                                          │ unitFieldForm    │
                                          └──────────────────┘
                                                  │
                              ┌────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ review/             │
                    │ selectValidOperation│  Choose which ops to export
                    │ reviewJson          │  Final JSON display + copy
                    │ operationCarousel   │  Preview each operation
                    └─────────────────────┘

Key lib/ modules:
  generate-descriptor.ts    ABI → initial Erc7730 (infers formats from param names/types)
  convertOperationToSchema  Operation → flat form fields (for React Hook Form)
  updateOperationFromSchema Form fields → Operation (writes back to store)
  removeExcludedFields      Strips user-excluded fields for final output
  utils.ts                  buildFullPath, removeNullValues, cn, truncateLabel

Shared:
  shared/sidebar.tsx         Navigation + operation list
  shared/selectOperation.tsx Operation selector dropdown
  shared/getScreensForOperation.tsx  Screen rendering
  hooks/use-navigation.tsx   Breadcrumb + step state
```

### Data Model

The core type `Erc7730` (from OpenAPI-generated types in `generate/api-types.ts`):

```
Erc7730
├── $schema: string (URL to ERC-7730 JSON schema spec)
├── context
│   ├── $id?: string (contract identifier for EIP-712 contexts)
│   └── contract?
│       ├── deployments: [{ chainId, address }]
│       └── abi: ABIEntry[]
├── metadata
│   ├── owner?: string
│   └── info?: { url, legalName }
└── display
    └── formats: Record<functionSelector, Operation>
        └── Operation
            ├── intent: string ("Transfer tokens to recipient")
            ├── fields: (FieldDescription | NestedFields)[]
            │   └── FieldDescription
            │       ├── path: string ("recipient", "amounts.[]")
            │       ├── label: string ("Recipient")
            │       ├── format: "raw"|"addressName"|"amount"|"tokenAmount"|"nftName"|"date"|"duration"|"calldata"|"unit"|"enum"
            │       └── params?: format-specific parameters
            ├── excluded?: string[] (field paths to hide)
            └── required?: string[] (field paths marked required)
```

### Two Zustand Stores

**erc7730Store** (`store/erc7730Store.ts`): Main data. Holds `generatedErc7730` (working copy) and `finalErc7730` (clean export copy). Persisted to sessionStorage as `store-erc7730`. Uses `skipHydration: true` — hydrated in `erc7730Provider.tsx`.

**useOperationStore** (`store/useOperationStore.ts`): UI state for which operations are selected, validated, or edited. Persisted to sessionStorage as `operation-store`.

### Format Inference (generate-descriptor.ts)

When generating from ABI, field formats are inferred by parameter name + Solidity type:

| Solidity type | Name contains | Inferred format |
|---|---|---|
| uint/int | "duration" | `duration` |
| uint/int | "deadline", "time", "timestamp" | `date` (encoding: timestamp) |
| uint/int | "height" | `date` (encoding: blockheight) |
| uint/int | "amount", "value", "price" | `amount` |
| address | "token", "asset" | `addressName` (types: ["token"]) |
| address | "collection", "nft" | `addressName` (types: ["collection"]) |
| address | "spender" | `addressName` (types: ["contract"]) |
| address | "from", "to", "owner", etc. | `addressName` (types: ["eoa","wallet"]) |
| bytes | "calldata" | `calldata` |
| bool, string, fallback | — | `raw` |

### Supported Chains

Ethereum (1), Polygon (137), BNB (56), Avalanche (43114), Arbitrum (42161), Optimism (10), Celo (42220), Worldchain (480), Base (8453), Scroll (534352), Linea (59144), zkSync (324). Defined in `lib/constants.ts`.

## How to Iteratively Review a Schema

This is the workflow for an AI agent reviewing/improving an ERC-7730 descriptor:

### 1. Load and Parse

Read the JSON file. Validate it has the required top-level keys: `$schema`, `context`, `metadata`, `display.formats`.

### 2. Check Context

- If `context.contract` exists: verify `deployments` has at least one entry with valid `chainId` (from supported list) and a valid Ethereum address.
- If `context.$id` exists: it should be a valid URI for EIP-712 contexts.
- The `abi` array should contain function entries with `type: "function"`, `name`, and `inputs`.

### 3. Review Metadata

- `metadata.owner` should be set (protocol/company name).
- `metadata.info.url` should be a valid URL.
- `metadata.info.legalName` is optional but recommended.

### 4. Review Each Operation

For each entry in `display.formats`:

**a. Check the key (function selector)**
- Should be a valid function signature like `functionName(type1,type2)`.
- Must correspond to a function in the ABI.

**b. Check intent**
- Must be a non-empty string.
- Should be a clear, human-readable sentence describing what this transaction does (e.g., "Approve token spending" not just "approve").

**c. Check fields**
- Every ABI parameter should either appear in `fields` or in `excluded`.
- Each field needs:
  - `path`: matches the ABI parameter path (e.g., `recipient`, `amounts.[]` for arrays, `params.tokenIn` for struct members).
  - `label`: human-readable, should NOT just repeat the parameter name verbatim — it should be descriptive for an end user.
  - `format`: must be one of the valid formats and appropriate for the Solidity type.
  - `params`: required for certain formats (`date` needs `encoding`, `addressName` needs `types`, `tokenAmount` needs `tokenPath`, `unit` needs `base`).

**d. Validate format-type compatibility**
- `date`/`duration`/`amount`/`tokenAmount`: underlying Solidity type should be uint/int.
- `addressName`: underlying Solidity type should be address.
- `calldata`: underlying Solidity type should be bytes.
- `nftName`: needs a collection address parameter.
- `raw` is always valid but consider if a more specific format applies.

**e. Check nested/array fields**
- Tuple parameters should use `NestedFields` with a `fields` array, not flat `FieldDescription`.
- Array parameters should have `.[]` in the path.

### 5. Review Excluded and Required

- `excluded` fields are not shown to the user — make sure nothing important is hidden.
- `required` fields must be shown — verify critical parameters (recipient, amount) are required.
- A field path should NOT appear in both `excluded` and `required`.

### 6. Cross-check with ABI

- Every non-view, non-pure function with inputs should ideally have a format entry.
- View/pure functions should NOT have format entries (they don't produce transactions).

### 7. Final Cleanup

- No null values in the output (use `removeNullValues` pattern).
- No empty arrays for `excluded`/`required` — use null/omit instead.
- `$schema` should point to the official spec URL.

### Iterative Improvement Checklist

```
[ ] All deployments have valid chainId and address
[ ] Metadata is complete (owner, url)
[ ] Every write function has a format entry
[ ] Every format has a descriptive intent (full sentence)
[ ] Every field has an appropriate format for its Solidity type
[ ] Format-specific params are present and correct
[ ] Labels are user-friendly (not raw parameter names)
[ ] Critical fields (recipient, amount, token) are in required
[ ] No important fields are incorrectly excluded
[ ] Nested structs use NestedFields, arrays use .[] paths
[ ] No null values, no empty arrays
[ ] JSON validates against the ERC-7730 schema spec
```

## Tech Stack

- Next.js 15.5 (App Router, static export, Turbopack dev)
- React 18, TypeScript 5.5 (strict mode)
- Zustand 5 (state) + React Hook Form 7 + Zod (forms/validation)
- Tailwind CSS 3.4 + shadcn/ui (Radix primitives)
- React Query 5 (async state)
- web3.js 4 (selector computation)
- Vitest (testing)

## Conventions

- All components are functional React with TypeScript
- Forms use React Hook Form with Zod schema validation via `@hookform/resolvers`
- UI components live in `components/ui/` (shadcn/ui, do not edit directly)
- App pages live in `app/` following Next.js App Router conventions
- State access via `useErc7730Store` hook from `store/erc7730Provider.tsx`
- Path alias `~/` resolves to `src/`
- Static export — no API routes, no server-side rendering
