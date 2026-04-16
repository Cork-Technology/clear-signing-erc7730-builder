import { type components } from "~/generate/api-types";
import {
  fetchAbiFromExplorer,
  generateDescriptor,
} from "~/lib/generate-descriptor";

export type GenerateResponse = components["schemas"]["InputERC7730Descriptor"];

export default async function generateERC7730({
  input,
  inputType,
  chainId,
}: {
  inputType: "address" | "abi";
  input: string;
  chainId?: number;
}): Promise<GenerateResponse | null> {
  const resolvedChainId = chainId ?? 1;

  let abi: unknown[];

  if (inputType === "address") {
    abi = await fetchAbiFromExplorer(resolvedChainId, input);
  } else {
    abi = JSON.parse(input) as unknown[];
  }

  const result = generateDescriptor({
    chainId: resolvedChainId,
    contractAddress:
      inputType === "address"
        ? input
        : "0xdeadbeef00000000000000000000000000000000",
    abi: abi as Parameters<typeof generateDescriptor>[0]["abi"],
  });

  return result;
}
