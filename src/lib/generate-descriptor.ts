import { type components } from "~/generate/api-types";

type InputERC7730Descriptor = components["schemas"]["InputERC7730Descriptor"];
type InputContractContext = components["schemas"]["InputContractContext"];
type InputFieldDescription = components["schemas"]["InputFieldDescription"];
type InputNestedFields = components["schemas"]["InputNestedFields"];
type FieldFormat = components["schemas"]["FieldFormat"];
type InputDeployment = components["schemas"]["InputDeployment"];

interface ABIInput {
  name: string;
  type: string;
  internalType?: string;
  components?: ABIInput[];
  indexed?: boolean;
}

interface ABIEntry {
  type: string;
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIInput[];
  stateMutability?: string;
  constant?: boolean;
  payable?: boolean;
  gas?: number;
  signature?: string;
  anonymous?: boolean;
}

// Etherscan V2 API — single endpoint for all supported chains
const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";

// Chain IDs supported by Etherscan V2
const SUPPORTED_CHAIN_IDS = new Set([
  1, 137, 56, 43114, 42161, 10, 8453, 534352, 59144,
]);

function containsAnyOf(name: string, ...keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function inferFieldFormat(
  name: string,
  abiType: string,
): {
  format: FieldFormat | undefined;
  params:
    | components["schemas"]["InputAddressNameParameters"]
    | components["schemas"]["InputDateParameters"]
    | undefined;
} {
  if (
    abiType.startsWith("uint") ||
    abiType.startsWith("int") ||
    abiType === "uint" ||
    abiType === "int"
  ) {
    if (containsAnyOf(name, "duration")) {
      return { format: "duration" as FieldFormat, params: undefined };
    }
    if (containsAnyOf(name, "height")) {
      return {
        format: "date",
        params: { encoding: "blockheight" },
      };
    }
    if (
      containsAnyOf(name, "deadline", "expiration", "until", "time", "timestamp")
    ) {
      return {
        format: "date",
        params: { encoding: "timestamp" },
      };
    }
    if (containsAnyOf(name, "amount", "value", "price")) {
      return { format: "amount", params: undefined };
    }
    return { format: "raw", params: undefined };
  }

  if (abiType === "address") {
    if (containsAnyOf(name, "collection", "nft")) {
      return {
        format: "addressName",
        params: { types: ["collection"] },
      };
    }
    if (containsAnyOf(name, "spender")) {
      return {
        format: "addressName",
        params: { types: ["contract"] },
      };
    }
    if (containsAnyOf(name, "asset", "token")) {
      return {
        format: "addressName",
        params: { types: ["token"] },
      };
    }
    if (
      containsAnyOf(name, "from", "to", "owner", "recipient", "receiver", "account")
    ) {
      return {
        format: "addressName",
        params: { types: ["eoa", "wallet"] },
      };
    }
    return {
      format: "addressName",
      params: { types: ["wallet", "eoa", "contract", "token", "collection"] },
    };
  }

  if (abiType.startsWith("bytes")) {
    if (containsAnyOf(name, "calldata")) {
      return { format: "calldata", params: undefined };
    }
    return { format: "raw", params: undefined };
  }

  if (abiType === "bool" || abiType === "string") {
    return { format: "raw", params: undefined };
  }

  return { format: "raw", params: undefined };
}

function buildFieldsFromInputs(
  inputs: ABIInput[],
  pathPrefix: string,
): (InputFieldDescription | InputNestedFields)[] {
  const fields: (InputFieldDescription | InputNestedFields)[] = [];

  for (const input of inputs) {
    const currentPath = pathPrefix ? `${pathPrefix}.${input.name}` : input.name;

    if (input.components && input.components.length > 0) {
      // Tuple/struct — create nested fields
      const baseType = input.type.replace(/\[\d*\]$/, "");
      if (baseType === "tuple" && input.type.endsWith("[]")) {
        // Array of tuples
        const nested = buildFieldsFromInputs(input.components, `${currentPath}.[]`);
        fields.push({
          path: currentPath,
          fields: nested,
        } as InputNestedFields);
      } else {
        // Plain tuple
        const nested = buildFieldsFromInputs(input.components, currentPath);
        fields.push({
          path: currentPath,
          fields: nested,
        } as InputNestedFields);
      }
    } else if (input.type.endsWith("[]")) {
      // Simple array
      const elementType = input.type.replace(/\[\d*\]$/, "");
      const { format, params } = inferFieldFormat(input.name, elementType);
      fields.push({
        path: `${currentPath}.[]`,
        label: input.name,
        format,
        params: params ?? undefined,
      } as InputFieldDescription);
    } else {
      // Leaf field
      const { format, params } = inferFieldFormat(input.name, input.type);
      fields.push({
        path: currentPath,
        label: input.name,
        format,
        params: params ?? undefined,
      } as InputFieldDescription);
    }
  }

  return fields;
}

function computeSelector(name: string, inputs: ABIInput[]): string {
  const types = inputs.map((i) => canonicalType(i)).join(",");
  const signature = `${name}(${types})`;

  // We need to compute keccak256 of the signature.
  // Use SubtleCrypto isn't available for keccak, so we do a simple
  // implementation or use the web3 library that's already a dependency.
  // For now, return the signature — the app already handles this.
  return signature;
}

function canonicalType(input: ABIInput): string {
  if (input.type === "tuple" || input.type === "tuple[]") {
    const inner = (input.components ?? []).map(canonicalType).join(",");
    return input.type === "tuple" ? `(${inner})` : `(${inner})[]`;
  }
  return input.type;
}

export async function fetchAbiFromExplorer(
  chainId: number,
  address: string,
  apiKey?: string,
): Promise<ABIEntry[]> {
  if (!SUPPORTED_CHAIN_IDS.has(chainId)) {
    throw new Error(
      `Chain ${chainId} is not supported for automatic ABI fetching. Please upload the ABI manually.`,
    );
  }

  const params = new URLSearchParams({
    chainid: chainId.toString(),
    module: "contract",
    action: "getabi",
    address,
  });
  if (apiKey) {
    params.set("apikey", apiKey);
  }

  const response = await fetch(`${ETHERSCAN_V2_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ABI from Etherscan: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    status: string;
    message: string;
    result: string;
  };

  if (data.status !== "1") {
    throw new Error(
      `Etherscan API error: ${data.message}. ${data.result}`,
    );
  }

  return JSON.parse(data.result) as ABIEntry[];
}

export function generateDescriptor(params: {
  chainId: number;
  contractAddress: string;
  abi: ABIEntry[];
}): InputERC7730Descriptor {
  const { chainId, contractAddress, abi } = params;

  // Filter to function-type entries only
  const functions = abi.filter(
    (entry): entry is ABIEntry & { name: string; inputs: ABIInput[] } =>
      entry.type === "function" && !!entry.name && !!entry.inputs,
  );

  // Build context
  const deployment: InputDeployment = {
    chainId,
    address: contractAddress,
  };

  const context: InputContractContext = {
    contract: {
      deployments: [deployment],
      abi: abi as InputContractContext["contract"]["abi"],
    },
  };

  // Build display formats
  const formats: Record<string, components["schemas"]["InputFormat"]> = {};

  for (const fn of functions) {
    const selector = computeSelector(fn.name, fn.inputs);
    const fields = buildFieldsFromInputs(fn.inputs, "");

    formats[selector] = {
      intent: fn.name,
      fields,
    };
  }

  return {
    $schema:
      "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json",
    context,
    metadata: {
      owner: undefined,
    },
    display: {
      formats,
    },
  };
}
