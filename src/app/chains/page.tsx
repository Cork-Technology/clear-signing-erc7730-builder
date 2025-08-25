import { HydrateClient } from "~/trpc/server";
import ChainsForm from "./chainsForm";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/shared/sidebar";

export default async function ChainsPage() {
  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar />
        <div className="container mx-auto flex p-4">
          <div className="w-full p-10">
            <ChainsForm />
          </div>
        </div>
      </SidebarProvider>
    </HydrateClient>
  );
}
