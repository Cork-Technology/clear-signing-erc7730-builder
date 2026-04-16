import MetadataForm from "./metaDataForm";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/shared/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="container mx-auto flex p-4">
        <div className="w-full p-10">
          <MetadataForm />
        </div>
      </div>
    </SidebarProvider>
  );
}
