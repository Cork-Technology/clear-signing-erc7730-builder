"use client";

import { FileJson } from "lucide-react";
import { Button } from "~/components/ui/button";
import * as React from "react";

import { ResponsiveDialog } from "~/components/ui/responsiveDialog";
import { useErc7730Store } from "~/store/erc7730Provider";
import { useToast } from "~/hooks/use-toast";
import { removeNullValues } from "~/lib/utils";

export function ReviewJson() {
  const [open, setOpen] = React.useState(false);
  const erc7730 = useErc7730Store((s) => s.finalErc7730);
  const schemaVersion = useErc7730Store((s) => s.getSchemaVersion)();
  const { toast } = useToast();

  const cleanedErc7730 = React.useMemo(() => {
    const cleaned = removeNullValues(erc7730);
    if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)) {
      const schemaUrl =
        schemaVersion === "v2"
          ? "https://eips.ethereum.org/assets/eip-7730/erc7730-v2.schema.json"
          : "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json";
      return { ...cleaned, $schema: schemaUrl };
    }
    return cleaned;
  }, [erc7730, schemaVersion]);

  const handleCopyToClipboard = () => {
    void navigator.clipboard.writeText(JSON.stringify(cleanedErc7730, null, 2));
    toast({
      title: "JSON copied to clipboard!",
    });
  };

  return (
    <ResponsiveDialog
      dialogTrigger={<Button variant="outline">Submit</Button>}
      dialogTitle="Submit your JSON"
      open={open}
      setOpen={setOpen}
    >
      <div className="space-y-4 overflow-hidden p-4 md:p-0">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              schemaVersion === "v2"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            ERC-7730 {schemaVersion}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Before submitting, please review your JSON. If everything looks good,
          copy it to your clipboard and create a pull request in the following
          repository:
          <a
            href="https://github.com/LedgerHQ/clear-signing-erc7730-registry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            LedgerHQ Clear Signing ERC7730 Registry
          </a>
          .
        </p>
        <pre className="max-h-64 overflow-auto rounded border bg-gray-100 p-4 text-sm dark:text-black">
          {JSON.stringify(cleanedErc7730, null, 2)}
        </pre>
        <Button onClick={handleCopyToClipboard}>Copy JSON to Clipboard</Button>
      </div>
    </ResponsiveDialog>
  );
}

export default ReviewJson;
