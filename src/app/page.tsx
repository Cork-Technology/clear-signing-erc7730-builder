import CardErc7730 from "./address-abi-form";
import { ModeToggle } from "~/components/ui/theme-switcher";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <h1 className="text-sm font-semibold">
          ERC7730 Json builder <span className="text-red-500">Alpha</span>
        </h1>
        <ModeToggle />
      </div>
      <CardErc7730 />
    </div>
  );
}
