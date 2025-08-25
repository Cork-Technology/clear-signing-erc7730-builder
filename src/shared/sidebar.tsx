"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  Sidebar,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { Ledger } from "~/icons/ledger";
import { useErc7730Store } from "~/store/erc7730Provider";
import SelectOperation from "./selectOperation";
import { Button } from "~/components/ui/button";
import { ModeToggle } from "~/components/ui/theme-switcher";
import { useRouter } from "next/navigation";
import useOperationStore from "~/store/useOperationStore";
import ResetButton from "./resetButton";
import { useNavigation } from "~/hooks/use-navigation";

export function AppSidebar() {
  const { getContractAddress, getDeployments } = useErc7730Store((s) => s);
  const router = useRouter();
  const { pathState } = useNavigation();

  const { validateOperation } = useOperationStore();

  const address = getContractAddress();
  const deployments = getDeployments();

  const getContractDisplayText = () => {
    if (deployments.length === 0) return "No deployments configured";
    if (deployments.length === 1) return address;
    return `${deployments.length} chain deployments`;
  };

  const isReviewAccessible = validateOperation.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center">
        <div className="rounded bg-black/5 p-4">
          <Ledger size={24} className="stroke-white stroke-1" />
        </div>
        <h1 className="text-base">Clear sign all the things</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup title="Contract">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">Contract</h2>
            <div className="break-words rounded border border-neutral-300 bg-black/5 p-3 text-sm">
              {getContractDisplayText()}
            </div>
          </div>
        </SidebarGroup>
        <SidebarSeparator />

        {pathState.showNavigationSteps && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuButton onClick={() => router.push("/chains")}>
                  Chains
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuButton onClick={() => router.push("/metadata")}>
                  Metadata
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <h2 className="mb-4 text-sm font-bold">
                Operation to clear sign
              </h2>
              <SelectOperation />
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-4">
          <div className="ms-auto">
            <ModeToggle />
          </div>
          <ResetButton />
          <Button
            className="rounded-full"
            disabled={!isReviewAccessible}
            onClick={() => router.push("/review")}
          >
            Review
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
