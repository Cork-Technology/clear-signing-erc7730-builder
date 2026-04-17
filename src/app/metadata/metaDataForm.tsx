"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Devices from "./devices";
import { Erc7730StoreContext, useErc7730Store } from "~/store/erc7730Provider";
import { Card } from "~/components/ui/card";
import type { Erc7730 } from "~/store/types";
import { DynamicBreadcrumb } from "~/components/ui/dynamic-breadcrumb";

const metaDataSchema = z.object({
  owner: z.string().min(1, {
    message: "Contract owner name is required.",
  }),
  url: z.string().min(1, {
    message: "URL is required.",
  }),
  legalName: z.string().min(1, {
    message: "Legal name is required.",
  }),
  tokenName: z.string().optional(),
  tokenTicker: z.string().optional(),
  tokenDecimals: z.coerce.number().optional(),
});

type MetadataFormType = z.infer<typeof metaDataSchema>;

const MetadataForm = () => {
  const router = useRouter();
  const hasHydrated = useContext(Erc7730StoreContext)?.persist?.hasHydrated();

  const {
    getMetadata,
    setMetadata,
    setContractId,
    getContractAddress,
    getContractId,
  } = useErc7730Store((s) => s);
  const metadata = getMetadata();
  const address = getContractAddress();
  const contractId = getContractId();

  // Update the schema to include the new field
  const form = useForm<
    MetadataFormType & { contractName: Erc7730["context"]["$id"] }
  >({
    resolver: zodResolver(
      metaDataSchema.extend({
        contractName: z.string().min(1, {
          message: "Smart contract name is required.",
        }),
      }),
    ),
    values: {
      owner: metadata?.owner ?? "",
      url: metadata?.info?.url ?? "",
      legalName: metadata?.info?.legalName ?? "",
      contractName: contractId ?? "",
      tokenName: metadata?.token?.name ?? "",
      tokenTicker: metadata?.token?.ticker ?? "",
      tokenDecimals: metadata?.token?.decimals ?? undefined,
    },
  });

  form.watch((value) => {
    if (hasHydrated === false) return;
    const token =
      value.tokenName || value.tokenTicker || value.tokenDecimals
        ? {
            name: value.tokenName ?? "",
            ticker: value.tokenTicker ?? "",
            decimals: value.tokenDecimals ?? 18,
          }
        : undefined;

    setMetadata({
      owner: value.owner,
      info: {
        legalName: value.legalName ?? "",
        url: value.url ?? "",
      },
      token,
    });
    setContractId(value.contractName);
  });

  useEffect(() => {
    if (hasHydrated && metadata === null) {
      router.push("/");
    }
  }, [metadata, router, hasHydrated, form]);

  const onSubmit = (
    data: MetadataFormType & { contractName: Erc7730["context"]["$id"] },
  ) => {
    const token =
      data.tokenName || data.tokenTicker || data.tokenDecimals
        ? {
            name: data.tokenName ?? "",
            ticker: data.tokenTicker ?? "",
            decimals: data.tokenDecimals ?? 18,
          }
        : undefined;

    setMetadata({
      owner: data.owner,
      info: {
        legalName: data.legalName,
        url: data.url,
      },
      token,
    });
    setContractId(data.contractName);
    router.push("/operations");
  };

  if (hasHydrated !== true) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-10"
        >
          <div>
            <div className="mb-10 flex w-full items-center justify-between">
              <h1 className="text-2xl font-bold">Metadata</h1>
            </div>
            <div className="mb-10">
              <DynamicBreadcrumb />
            </div>

            <Card className="mb-40 flex h-fit flex-col gap-6 p-6">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Smart contract owner common name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <div>
                      <FormLabel>URL</FormLabel>
                      <FormDescription>
                        Where to find information on the entity the user
                        interacts with.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Smart contract name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  ERC-20 Token Info (optional, v2)
                </summary>
                <div className="mt-3 flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="tokenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="e.g. Tether USD"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tokenTicker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Ticker</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="e.g. USDT"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tokenDecimals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Decimals</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value ?? ""}
                            placeholder="e.g. 6"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </details>
            </Card>
            <div className="flex w-full items-center justify-end">
              <Button onClick={form.handleSubmit(onSubmit)}>Continue</Button>
            </div>
          </div>
          {metadata && (
            <div className="hidden flex-row justify-between lg:flex">
              <Devices
                metadata={metadata}
                address={address}
                contractName={contractId}
              />
            </div>
          )}
        </form>
      </Form>
    </>
  );
};

export default MetadataForm;
