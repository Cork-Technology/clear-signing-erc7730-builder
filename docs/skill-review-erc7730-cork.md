# Skill: `review-erc7730-cork` — ERC-7730 Clear Signing Descriptor Reviewer

## Metadata

- **Recommended base skill:** `review-board`
- **Why:** Multi-perspective review with personality-driven agents, cross-review consensus, and structured output. The ERC-7730 reviewer needs multiple review angles (ABI correctness, copywriting quality, device constraints, Cork conventions), disagreement synthesis, and actionable findings.
- **References:** `cork-context` (domain knowledge), `erc7730-patterns.md` (CS1–CS15 pattern library)

---

## SKILL.md

```markdown
---
name: review-erc7730-cork
description: >
  Review ERC-7730 clear signing descriptors for Cork Protocol.
  Validates ABI alignment, device constraints, copywriting conventions, and Cork-specific patterns.
  Supports both contract-context and EIP-712 descriptors. Single files or batch review.
trigger: >
  Use when reviewing clear signing schemas, ERC-7730 descriptors, or registry files.
  Triggers on: "review clear signing", "check this ERC-7730", "review descriptor",
  "validate this schema", "clear signing review", "registry review",
  "review this JSON for clear signing", "check this against the ABI",
  "does this descriptor look right", "review before submitting to registry".
  Also triggers when an ERC-7730 JSON is pasted or loaded and the user asks for feedback,
  or when a PR to the clear-signing-erc7730-registry is being reviewed.
---

# review-erc7730-cork — ERC-7730 Clear Signing Descriptor Reviewer

## Domain Context

#include cork-context — Cork Protocol domain knowledge (terminology, products, token types, conventions)

Load cork-context for:
- **Token types:** cST (Cork Swap Token, internal, 18 decimals), cPT (Cork Principal Token, internal, 18 decimals), CA (Collateral Asset, external, variable decimals), REF (Reference Asset, external, variable decimals)
- **Naming rules:** Always "cST"/"cPT" (lowercase c), never "CST"/"CPT". "Tokens" = Cork-minted. "Assets" = external
- **Product modules:** Cork Pool, Cork Phoenix, Cork Vaults, Protected Loops, Rollovers
- **Paired function patterns:** exercise/exerciseOther share intent, unwindSwap/unwindExercise share "Repurchase"

## Review Patterns

Load `references/erc7730-patterns.md` — the complete CS1–CS15 pattern library encoding Baptiste's review feedback and Cork conventions. This is the authoritative checklist.

---

## Purpose

Comprehensive review of ERC-7730 clear signing descriptors for Cork Protocol. This is a **dual-dimension review**:

1. **JSON correctness** — structure, paths, ABI alignment, format params
2. **Copywriting quality** — user-facing labels, intents, Cork terminology, device readability

Both matter equally. A structurally correct descriptor with bad labels is as harmful as a broken one — users on a Ledger device can't distinguish between "wrong" and "confusing."

---

## Step 0 — Gather Context

### 0.1 The Descriptor(s) Under Review (REQUIRED)
**Sources:**
- User pastes JSON directly
- File path(s) on disk
- GitHub repo browse (e.g., from LedgerHQ registry PR)
- Multiple files for batch review

**Parse and extract:**
- Context type: contract or EIP-712
- Number of format entries (functions/messages with display)
- Includes references (if any)

### 0.2 Contract ABI (REQUIRED)
**Sources (in priority order):**
1. Embedded in the descriptor's `context.contract.abi` — most descriptors include it
2. Separate ABI file provided by user
3. Etherscan V2 API fetch using deployment address and chainId from the descriptor
4. For EIP-712: the typed data schema is in `context.eip712.schemas`

**Why:** Every structural check (path validity, format-ABI alignment, orphan detection) depends on the ABI.

### 0.3 Contract Source Code (RECOMMENDED)
**Why:** Enables semantic review — understanding what functions actually do, not just what their parameters are named.
**Sources:** GitHub, verified Etherscan source
**If unavailable:** Proceed but flag that semantic review is limited to ABI-level analysis. Mark intent accuracy findings as "low confidence."

### 0.4 Existing Cork Descriptors (RECOMMENDED for batch/consistency review)
**Why:** Cross-file consistency — metadata, intent patterns, include usage.
**Source:** Other Cork files in the same registry PR, or existing files in the LedgerHQ registry.

### 0.5 Include Files (AUTO-DETECT)
If the descriptor has an `includes` field, fetch the referenced file(s) from the registry.
**Critical:** Many "missing display" false positives come from not tracing includes. Always resolve includes before flagging missing functions.

---

## Step 1 — Automated Structural Checks (Dimension 1)

Run these deterministic checks first. Report each as PASS/FAIL with exact location.

### Critical (🔴) — blocks approval

| ID | Check | Details |
|----|-------|---------|
| S1 | **Context has ≥1 deployment** | Valid `chainId` (number) + `address` (0x-prefixed hex, 42 chars) |
| S2 | **ABI present and parseable** | Must be a JSON array of objects, each with `type` field |
| S3 | **Format-ABI alignment** | Every key in `display.formats` must match a function signature derivable from the ABI. Compute `functionName(canonicalType1,canonicalType2,...)` for each ABI entry and compare |
| S4 | **Path validity** | For every field's `path` in a format entry, the path must match a parameter name in the corresponding ABI function. For nested paths (`param.field`), trace through tuple components. For arrays, verify `.[]` paths match array-typed parameters |
| S5 | **Required paths valid** | Every entry in `required[]` must reference a `path` that exists in that format's `fields` |
| S6 | **Format params complete** | `tokenAmount` → has `tokenPath` or `token`. `date` → has `encoding`. `calldata` → has `calleePath` or `callee`. `nftName` → has `collectionPath` or `collection`. `enum` → has `$ref`. `unit` → has `base` |

### High (🟠)

| ID | Check | Details |
|----|-------|---------|
| S7 | **No orphaned formats** | No format entries for functions that don't exist in the ABI (CS4) |
| S8 | **Token amounts not raw** | `uint256` fields representing token amounts should use `tokenAmount` or `amount`, not `raw`. Apply Cork nuance: CA/REF amounts may use `raw` if no token address in calldata (CS5) |

### Medium (🟡)

| ID | Check | Details |
|----|-------|---------|
| S9 | **No null values** | No `null` or `undefined` anywhere in the JSON |
| S10 | **No empty collections** | No `"sources": []`, `"params": {}`, or `"types": []` — omit if empty |
| S11 | **Metadata complete** | `metadata.owner` present, `metadata.info` has `legalName` and `url` |

### Info (🔵)

| ID | Check | Details |
|----|-------|---------|
| S12 | **Schema reference** | `$schema` field present and points to valid spec URL |
| S13 | **Trailing newline** | File ends with exactly one `\n` |

---

## Step 2 — Semantic Review (Dimension 2)

For each format entry, evaluate the meaning and correctness against the contract's behavior.

### Critical (🔴)

| ID | Pattern | What to check |
|----|---------|---------------|
| CS1 | **ABI field path mismatch** | Already covered by S4 — but also check tuple/struct nesting depth and array indexing |
| CS2 | **Misleading intent** | Does the intent accurately describe what happens when the user signs? Read the function implementation if source available. A swap function with "Exercise" intent is dangerous |
| CS3 | **Missing destructive functions** | Check ABI for: `renounceOwnership`, `renounceRole`, `selfdestruct`, `upgradeToAndCall`, any function that permanently changes admin/access state. Each must have a display entry with warning in the intent. **BUT:** check includes first — `common-ownership.json` covers many of these |

### High (🟠)

| ID | Pattern | What to check |
|----|---------|---------------|
| CS4 | **Orphaned formats** | Covered by S7 |
| CS5 | **Raw for token amounts** | Covered by S8 — but add Cork nuance here: cST/cPT amounts MUST use `tokenAmount`. CA/REF amounts: `raw` is acceptable if no token address in calldata. Flag only when a token address IS available but unused |
| CS5b | **Includes speculation** | Do NOT flag "include shadowing" unless you have verified the ERC-7730 spec says includes shadow local formats. If unsure, do not flag. (Baptiste: "not sure what 'may be shadowed by local display block' means") |
| CS6 | **Timelock inconsistency** | If contract has `schedule` and `execute` functions, both must use the same field formats. If `execute` decodes calldata, `schedule` must too |
| CS7 | **Missing admin functions** | Parameter-changing functions (setFee, setCap, setSpread, etc.) should have display. But only if callable by human admin/multisig. Check includes before flagging |

### Medium (🟡)

| ID | Pattern | What to check |
|----|---------|---------------|
| CS11 | **Missing callable functions** | Only flag for functions a human would actually sign. Skip view/pure, internal callbacks, contract-to-contract calls. Ask: "Would a human ever sign a transaction calling this function directly?" |
| CS12 | **Duplicate intents** | Same intent string for different operations. **Exceptions (don't flag):** Cork's intentional shared intents — exercise/exerciseOther, unwindSwap/unwindExercise/unwindExerciseOther ("Repurchase"), and any paired exact-in/exact-out functions. Only flag when operations genuinely produce different outcomes for the user |

---

## Step 3 — Copywriting Review (Dimension 3)

Read ALL intents and labels as a batch, then check:

### Intent Quality

| ID | Rule | Example Good | Example Bad |
|----|------|-------------|-------------|
| CS8a | Capitalize first letter | "Swap cST for collateral" | "swap cST for collateral" |
| CS8b | No trailing spaces | `"intent": "Swap"` | `"intent": "Swap "` |
| CS9a | cST/cPT always lowercase c | "Exercise cST" | "Exercise CST" |
| CS9b | No bare acronyms or inconsistent abbreviations | Consistent across all files | "cST" in one file, "CST" in another |
| CS9c | Use "and" not "+" | "Mint cPT and cST" | "Mint cPT+cST" |
| CS9d | Conditions ≠ intents | "Redeem collateral by burning cPT" | "Redeem at expiry" |

### Label Quality

| ID | Rule | Example Good | Example Bad |
|----|------|-------------|-------------|
| CS8c | Sentence case | "Receiver of collateral" | "Receiver Of Collateral" |
| CS9e | Specific, not vague | "Receiver of cPT shares" | "Receiver" |
| CS10 | Token vs Asset distinction | "cST amount" (token), "Collateral amount" (asset) | Using "token" for CA/REF |

### Cork Terminology (from cork-context)

- "Tokens" = Cork-minted instruments (cST, cPT) — use "token" in labels
- "Assets" = External instruments (CA, REF) — use "collateral", "asset", or specific name in labels
- Never use "CDS", "credit default swap", "insurance" in any user-facing text
- "onchain" not "on-chain"

---

## Step 4 — Device Constraint Review (Dimension 4)

### Checks

| ID | Check | Severity | Rule |
|----|-------|----------|------|
| D1 | **Label length** | 🟠 High | Labels > 20 chars will be truncated. For each, show: original → truncated preview (`label.slice(0, 17) + "..."`). Is the truncated version still meaningful? |
| D2 | **Screen count** | 🟡 Medium | Screens = 2 + ceil(included_fields / 3). Flag if > 8 screens — user abandonment risk. Report exact count per function |
| D3 | **Intent length** | 🟡 Medium | Approximate chars per line: Flex ~21 chars, Stax ~17 chars. Intent wraps to 2 lines on title screen. Flag if > 42 chars (Flex) or > 34 chars (Stax) — will overflow |
| D4 | **Fields per function** | 🔵 Info | Report total field count and screen count for every function in a summary table |

### Device Preview Table (always include in output)

```
| Function             | Intent                        | Fields | Screens | Truncated? |
|----------------------|-------------------------------|--------|---------|------------|
| swap(uint256,...)    | Swap cST for collateral       | 5      | 4       | none       |
| exercise(uint256)    | Exercise cST to receive CA    | 3      | 3       | none       |
| approve(addr,uint256)| Approve token spending        | 2      | 3       | none       |
```

---

## Step 5 — Cross-File Consistency (Dimension 5)

**Only when reviewing multiple files.** Skip for single-file review.

| ID | Check | Severity |
|----|-------|----------|
| X1 | **Metadata identical** | 🟡 Medium — `owner`, `legalName`, `url` must be the same across all Cork files |
| X2 | **Intent consistency** | 🟡 Medium — Same function name across different contracts should use the same intent (unless contract semantics genuinely differ) |
| X3 | **Include usage** | 🔵 Info — Standard OZ functions should use includes, not be inlined in every file |
| X4 | **Schema version** | 🔵 Info — All files should reference the same `$schema` version |
| X5 | **Enum/constant consistency** | 🔵 Info — Shared enums and constants should use the same values across files |

---

## Step 6 — False Positive Filters

**Before reporting ANY finding, run through these filters.** False positives erode reviewer trust.

| # | Filter | Action |
|---|--------|--------|
| FP1 | Function is covered by an `includes` file | → NOT missing. Resolve all includes before flagging CS3/CS7/CS11 |
| FP2 | Shared intent is for Cork-equivalent operations | → NOT duplicate. exercise/exerciseOther, unwind variants — see CS12 exceptions |
| FP3 | `raw` format for CA/REF amounts where no token address in calldata | → ACCEPTABLE. Only flag if token address IS available but not used via `tokenPath` |
| FP4 | Function is not callable by humans | → SKIP. View/pure, internal callbacks, contract-only functions |
| FP5 | Path references a field from an included file | → NOT a mismatch. Trace through includes |
| FP6 | ABI entries for inherited functions not in this file's ABI | → Check if a common include provides both ABI and display. If yes, not missing |

---

## Step 7 — Synthesize & Output

### Finding Format

For each finding:
```
### [SEVERITY] [ID] Title
**File:** filename.json
**Location:** display.formats["functionName(...)"].fields[2].path
**Description:** What's wrong and why it matters
**Suggested fix:** Specific JSON change or label rewrite
**False positive check:** [which FP filter was applied, if any]
```

### Output Structure

```markdown
# ERC-7730 Review: [contract name]

## Summary
- Files reviewed: N
- Context type: contract / EIP-712
- Functions with display: N / N total write functions in ABI
- Screen count range: min–max per function
- Includes resolved: [list] or "none"

## Automated Checks
| ID  | Check                    | Result |
|-----|--------------------------|--------|
| S1  | Deployments valid        | PASS   |
| S2  | ABI parseable            | PASS   |
| S3  | Format-ABI alignment     | PASS   |
| ... | ...                      | ...    |

## Findings

### 🔴 Critical (N)
[findings...]

### 🟠 High (N)
[findings...]

### 🟡 Medium (N)
[findings...]

### 🔵 Info (N)
[findings...]

## Device Preview
| Function             | Intent                     | Fields | Screens | Truncated? |
|----------------------|----------------------------|--------|---------|------------|
| ...                  | ...                        | ...    | ...     | ...        |

## Cross-File Consistency
[if batch review — list X1-X5 results]

## Verdict

One of:
- ✅ **APPROVE** — No critical or high findings
- ✅ **APPROVE WITH NOTES** — Medium/info findings only, none blocking
- ❌ **REQUEST CHANGES** — Critical or high findings that must be fixed

### Required Changes (if REQUEST CHANGES)
1. [specific change needed]
2. [specific change needed]

### Suggested Improvements (optional, non-blocking)
1. [improvement suggestion]
```

---

## Reviewer Personalities (for review-board integration)

When invoked via review-board, these are the recommended reviewer angles:

1. **ABI Auditor** — Focuses on structural correctness: path validity, format-ABI alignment, orphans, param completeness. Zero tolerance for mismatches.

2. **Device UX Reviewer** — Focuses on what the user actually sees on the Ledger screen: label truncation, screen count, intent readability, information hierarchy. Simulates the signing experience.

3. **Cork Domain Expert** — Focuses on Cork-specific patterns: token vs asset terminology, paired function intents, cST/cPT conventions, module-appropriate language. References cork-context.

4. **Copywriter** — Focuses on label and intent quality: capitalization, sentence case, specificity, clarity, consistency across functions. Reads all text as a batch for tone coherence.

5. **Security Reviewer** (deep mode only) — Focuses on: are destructive functions covered? Could a misleading intent trick a user? Are critical fields marked required? Is any important information excluded?
```

---

## Directory Structure

```
~/.claude/skills/review-erc7730-cork/
  SKILL.md                          <- the skill prompt above
  references/
    erc7730-patterns.md             <- copy from review-pr-cork/references/
    device-constraints.md           <- extracted from builder's src/lib/device-constraints.ts
```
