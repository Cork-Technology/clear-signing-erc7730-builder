import OperationManagement from "./operationManagement";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/shared/sidebar";

export default function Functions() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="container mx-auto flex p-4">
        <OperationManagement />
      </div>
    </SidebarProvider>
  );
}
