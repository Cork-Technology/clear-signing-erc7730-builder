import { describe, it, expect } from "vitest";
import { generateDescriptor } from "./generate-descriptor";
import { SCHEMA_URLS } from "./constants";

const sampleAbi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
];

describe("generateDescriptor", () => {
  describe("v2 generation", () => {
    it("uses named parameter signatures as format keys", () => {
      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: sampleAbi,
        schemaVersion: "v2",
      });

      const keys = Object.keys(result.display.formats);
      expect(keys).toContain("transfer(address to,uint256 amount)");
      expect(keys).toContain("approve(address spender,uint256 amount)");
    });

    it("sets the v2 schema URL", () => {
      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: sampleAbi,
        schemaVersion: "v2",
      });

      expect(result.$schema).toBe(SCHEMA_URLS.v2);
    });

    it("omits abi from context.contract", () => {
      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: sampleAbi,
        schemaVersion: "v2",
      });

      const contract = (result.context as { contract: Record<string, unknown> })
        .contract;
      expect(contract).not.toHaveProperty("abi");
      expect(contract).toHaveProperty("deployments");
    });
  });

  describe("v1 generation", () => {
    it("sets the v1 schema URL", () => {
      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: sampleAbi,
        schemaVersion: "v1",
      });

      expect(result.$schema).toBe(SCHEMA_URLS.v1);
    });

    it("includes abi in context.contract", () => {
      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: sampleAbi,
        schemaVersion: "v1",
      });

      const contract = (result.context as { contract: Record<string, unknown> })
        .contract;
      expect(contract).toHaveProperty("abi");
    });
  });

  describe("namedSignature with tuple input", () => {
    it("formats tuple parameters correctly in v2 keys", () => {
      const tupleAbi = [
        {
          type: "function",
          name: "execute",
          inputs: [
            {
              name: "order",
              type: "tuple",
              components: [
                { name: "maker", type: "address" },
                { name: "amount", type: "uint256" },
              ],
            },
            { name: "deadline", type: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ];

      const result = generateDescriptor({
        chainId: 1,
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        abi: tupleAbi,
        schemaVersion: "v2",
      });

      const keys = Object.keys(result.display.formats);
      expect(keys).toContain(
        "execute((address maker,uint256 amount) order,uint256 deadline)",
      );
    });
  });
});
