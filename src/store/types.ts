import { type paths, type components } from "~/generate/api-types";

export type SchemaVersion = "v1" | "v2";

export type Erc7730 =
  paths["/api/py/generateERC7730"]["post"]["responses"]["200"]["content"]["application/json"];

export type Operation = Erc7730["display"]["formats"][string];

export type OperationField = Operation["fields"][number];

export interface ScreenableField {
  path?: string | null;
  label?: string | null;
  format?: string | null;
  params?: unknown;
  fields?: ScreenableField[];
  [key: string]: unknown;
}

export interface ScreenableOperation {
  intent?: string | Record<string, string> | null;
  fields: ScreenableField[];
  [key: string]: unknown;
}

export type DateField = components["schemas"]["InputDateParameters"];

export type OperationMetadata = {
  operationName: string;
  metadata: Erc7730["metadata"] | null;
};
