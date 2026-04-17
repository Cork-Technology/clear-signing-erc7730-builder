"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";

import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import SampleAddressAbiCard from "./sampleAddressAbiCard";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { ZodError } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useErc7730Store } from "~/store/erc7730Provider";
import useFunctionStore from "~/store/useOperationStore";
import generateFromERC7730 from "./generateFromERC7730";
import { SUPPORTED_CHAINS } from "~/lib/constants";
import { Upload, FileJson } from "lucide-react";
import type { Erc7730, SchemaVersion } from "~/store/types";
import GitHubRepoBrowser from "./github-repo-browser";

const CardErc7730 = () => {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"abi" | "schema">("abi");
  const [chainId, setChainId] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [schemaFile, setSchemaFile] = useState<Erc7730 | null>(null);
  const { setErc7730, setSchemaVersion, getSchemaVersion } = useErc7730Store(
    (state) => state,
  );
  const schemaVersion = getSchemaVersion();
  const router = useRouter();

  const {
    mutateAsync: fetchERC7730Metadata,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: (input: string) =>
      generateFromERC7730({
        input,
        inputType: "abi",
        chainId,
        schemaVersion,
      }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputType === "schema" && schemaFile) {
      useFunctionStore.persist.clearStorage();
      setErc7730(schemaFile);
      router.push("/chains");
      return;
    }

    const erc7730 = await fetchERC7730Metadata(input);

    if (erc7730) {
      console.log(erc7730);
      useFunctionStore.persist.clearStorage();

      setErc7730(erc7730);
      router.push("/chains");
    }
  };

  const onTabChange = (value: string) => {
    setInputType(value as "abi" | "schema");
    setInput("");
    setFileError(null);
    setIsDragOver(false);
    setSchemaFile(null);
  };

  const validateAndSetABI = async (file: File) => {
    setFileError(null);

    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      setFileError("Please upload a JSON file");
      return;
    }

    try {
      const text = await file.text();

      let parsedAbi: unknown;
      try {
        parsedAbi = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON format");
      }

      if (!Array.isArray(parsedAbi)) {
        throw new Error("ABI must be an array");
      }

      if (parsedAbi.length > 0) {
        const hasValidAbiStructure = parsedAbi.every(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).type === "string",
        );

        if (!hasValidAbiStructure) {
          throw new Error(
            "Invalid ABI structure - each item must have a 'type' field",
          );
        }
      }

      setInput(JSON.stringify(parsedAbi, null, 2));
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Failed to read file",
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      const file = files[0];
      await validateAndSetABI(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      const file = files[0];
      await validateAndSetABI(file);
    }
    e.target.value = '';
  };

  const validateSchemaText = (text: string): Erc7730 => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON format");
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Schema must be a JSON object");
    }

    const schema = parsed as Record<string, unknown>;

    if (!schema.context || typeof schema.context !== "object") {
      throw new Error("Missing or invalid 'context' field");
    }
    if (!schema.metadata || typeof schema.metadata !== "object") {
      throw new Error("Missing or invalid 'metadata' field");
    }
    if (!schema.display || typeof schema.display !== "object") {
      throw new Error("Missing or invalid 'display' field");
    }

    return schema as unknown as Erc7730;
  };

  const validateAndSetSchema = async (file: File) => {
    setFileError(null);
    setSchemaFile(null);

    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      setFileError("Please upload a JSON file");
      return;
    }

    try {
      const text = await file.text();
      const schema = validateSchemaText(text);
      setSchemaFile(schema);
      setInput(file.name);
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Failed to read file",
      );
    }
  };

  const handleSchemaTextChange = (text: string) => {
    setInput(text);
    setFileError(null);
    setSchemaFile(null);

    if (!text.trim()) return;

    try {
      const schema = validateSchemaText(text);
      setSchemaFile(schema);
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Failed to read file",
      );
    }
  };

  const handleGitHubAbiSelect = (content: string) => {
    setFileError(null);
    try {
      let parsedAbi: unknown;
      try {
        parsedAbi = JSON.parse(content);
      } catch {
        throw new Error("Invalid JSON format");
      }

      if (!Array.isArray(parsedAbi)) {
        throw new Error("ABI must be an array");
      }

      if (parsedAbi.length > 0) {
        const hasValidAbiStructure = parsedAbi.every(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).type === "string",
        );
        if (!hasValidAbiStructure) {
          throw new Error("Invalid ABI structure - each item must have a 'type' field");
        }
      }

      setInput(JSON.stringify(parsedAbi, null, 2));
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Not a valid ABI file",
      );
    }
  };

  const handleGitHubFileSelect = (content: string) => {
    setFileError(null);
    setSchemaFile(null);

    try {
      const schema = validateSchemaText(content);
      setSchemaFile(schema);
      setInput(JSON.stringify(schema, null, 2));
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Not a valid ERC-7730 schema",
      );
    }
  };

  const handleSchemaDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      await validateAndSetSchema(files[0]);
    }
  };

  const handleSchemaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      await validateAndSetSchema(files[0]);
    }
    e.target.value = '';
  };

  const menuItems = [
    { key: "abi" as const, label: "ABI" },
    { key: "schema" as const, label: "Load Schema" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="sticky top-0 flex h-screen w-[200px] shrink-0 flex-col border-r bg-muted/40 p-4">
        <h2 className="mb-6 text-sm font-semibold text-muted-foreground">Input Method</h2>
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm transition-colors",
                inputType === item.key
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <form onSubmit={handleSubmit} className="mb-4 flex w-full flex-col gap-4">
            {inputType === "abi" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Schema Version</Label>
                  <Select
                    value={schemaVersion}
                    onValueChange={(v) =>
                      setSchemaVersion(v as SchemaVersion)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">v1 (legacy)</SelectItem>
                      <SelectItem value="v2">v2 (current)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chain-select">Chain</Label>
                  <Select
                    value={chainId.toString()}
                    onValueChange={(value) => setChainId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CHAINS.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abi">ABI</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="abi"
                      placeholder="Paste your ABI here or drag & drop a JSON file..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`transition-colors ${
                        isDragOver
                          ? "border-2 border-dashed border-blue-400 bg-blue-50"
                          : "border-input"
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="abi-file-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('abi-file-input')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload JSON File
                      </Button>
                    </div>
                    {fileError && (
                      <p className="text-sm text-red-600">{fileError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or load from GitHub</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <GitHubRepoBrowser onFileSelect={handleGitHubAbiSelect} />
              </div>
            )}

            {inputType === "schema" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ERC-7730 Schema JSON</Label>
                  <Textarea
                    placeholder="Paste your ERC-7730 JSON here..."
                    value={schemaFile && !input.startsWith("{") ? "" : input}
                    onChange={(e) => handleSchemaTextChange(e.target.value)}
                    className="min-h-[160px] font-mono text-xs"
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div
                    className={`flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors ${
                      isDragOver
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
                        : schemaFile && !input.startsWith("{")
                          ? "border-green-400 bg-green-50 dark:bg-green-950"
                          : "border-input hover:border-muted-foreground/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleSchemaDrop}
                    onClick={() => document.getElementById('schema-file-input')?.click()}
                  >
                    <FileJson className="mb-1 h-6 w-6 text-muted-foreground" />
                    {schemaFile && !input.startsWith("{") ? (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Loaded: {input}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Drop a JSON file here or click to browse
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleSchemaFileSelect}
                    className="hidden"
                    id="schema-file-input"
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <GitHubRepoBrowser onFileSelect={handleGitHubFileSelect} />
                  {fileError && (
                    <p className="text-sm text-red-600">{fileError}</p>
                  )}
                  {schemaFile && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Valid ERC-7730 schema detected
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading || (inputType === "schema" && !schemaFile)}>
              Submit
            </Button>
          </form>

          {inputType === "abi" && (
            <SampleAddressAbiCard setInput={setInput} inputType="abi" />
          )}

          {error && (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                {error instanceof ZodError
                  ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    JSON.parse(error.message)[0].message
                  : error.message}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CardErc7730;
