"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Erc7730StoreContext, useErc7730Store } from "~/store/erc7730Provider";
import { DynamicBreadcrumb } from "~/components/ui/dynamic-breadcrumb";
import { SUPPORTED_CHAINS } from "~/lib/constants";

const deploymentSchema = z.object({
  chainId: z.number().min(1, "Chain ID is required"),
  address: z
    .string()
    .min(1, "Contract address is required")
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      "Must be a valid Ethereum address (0x followed by 40 hex characters)",
    ),
});

const chainsFormSchema = z
  .object({
    deployments: z
      .array(deploymentSchema)
      .min(1, "At least one deployment is required"),
  })
  .refine(
    (data) => {
      const chainIds = data.deployments.map((d) => d.chainId);
      const uniqueChainIds = new Set(chainIds);
      return uniqueChainIds.size === chainIds.length;
    },
    {
      message: "Each chain can only be selected once",
      path: ["deployments"],
    },
  );

type ChainsFormType = z.infer<typeof chainsFormSchema>;

const ChainsForm = () => {
  const router = useRouter();
  const hasHydrated = useContext(Erc7730StoreContext)?.persist?.hasHydrated();
  const [isLoading, setIsLoading] = useState(false);

  const { generatedErc7730, setDeployments, getDeployments } = useErc7730Store(
    (s) => s,
  );

  const form = useForm<ChainsFormType>({
    resolver: zodResolver(chainsFormSchema),
    defaultValues: {
      deployments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deployments",
  });

  useEffect(() => {
    if (hasHydrated) {
      const existingDeployments = getDeployments();
      if (existingDeployments && existingDeployments.length > 0) {
        form.reset({ deployments: existingDeployments });
      }
    }
  }, [hasHydrated, getDeployments, form]);

  useEffect(() => {
    if (hasHydrated && !generatedErc7730) {
      router.push("/");
    }
  }, [generatedErc7730, router, hasHydrated]);

  const onSubmit = async (data: ChainsFormType) => {
    setIsLoading(true);
    try {
      setDeployments(data.deployments);
      router.push("/metadata");
    } finally {
      setIsLoading(false);
    }
  };

  const addDeployment = () => {
    const availableChains = getAvailableChains(-1);
    if (availableChains.length > 0) {
      append({ chainId: availableChains[0]!.id, address: "" });
    }
  };

  const canAddMoreChains = () => {
    const selectedChainIds = form.watch("deployments").map((d) => d.chainId);
    return selectedChainIds.length < SUPPORTED_CHAINS.length;
  };

  const removeDeployment = (index: number) => {
    remove(index);
  };

  const getAvailableChains = (currentIndex: number) => {
    const selectedChainIds = form
      .watch("deployments")
      .map((deployment, index) =>
        index !== currentIndex ? deployment.chainId : null,
      )
      .filter((id) => id !== null);

    return SUPPORTED_CHAINS.filter(
      (chain) => !selectedChainIds.includes(chain.id),
    );
  };

  if (hasHydrated !== true) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chains Setup</h1>
        <p className="mt-2 text-gray-600">
          Configure the contract deployments across different blockchain
          networks.
        </p>
        <div className="mt-4">
          <DynamicBreadcrumb />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.deployments?.message && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {form.formState.errors.deployments.message}
            </div>
          )}
          <div className="font-medium">Deployments</div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between gap-2">
                  <FormField
                    control={form.control}
                    name={`deployments.${index}.chainId`}
                    render={({ field }) => (
                      <FormItem className="w-full space-y-1">
                        <FormLabel className="text-sm">Chain</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select chain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableChains(index).length > 0 ? (
                              getAvailableChains(index).map((chain) => (
                                <SelectItem
                                  key={chain.id}
                                  value={chain.id.toString()}
                                >
                                  {chain.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="">
                                No available chains
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`deployments.${index}.address`}
                    render={({ field }) => (
                      <FormItem className="w-full space-y-1">
                        <FormLabel className="text-sm">
                          Contract Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x..."
                            {...field}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={fields.length === 1}
                    onClick={() => removeDeployment(index)}
                    className="h-9 w-9 flex-none self-end p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addDeployment}
              disabled={!canAddMoreChains()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {canAddMoreChains() ? "Add Another Chain" : "All Chains Added"}
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? "Saving..." : "Continue to Metadata"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default ChainsForm;
