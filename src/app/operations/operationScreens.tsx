import { type UseFormReturn } from "react-hook-form";
import { Device } from "~/components/devices/device";
import { ReviewScreen } from "~/components/devices/reviewScreen";
import type { DisplayItem } from "~/shared/getScreensForOperation";
import { getScreensForOperation } from "~/shared/getScreensForOperation";
import { type Operation } from "~/store/types";
import { type OperationFormType } from "./editOperation";
import { useErc7730Store } from "~/store/erc7730Provider";

interface Props {
  operation: Operation;
  form: UseFormReturn<OperationFormType>;
  activeFieldPath: string;
  allScreenActive: boolean;
}

const OperationScreens = ({ operation, form, activeFieldPath }: Props) => {
  const { getMetadata } = useErc7730Store((s) => s);
  const metadata = getMetadata();
  const owner = metadata?.owner;
  const ownerField: DisplayItem | null = owner
    ? {
        displayValue: owner,
        isActive: false,
        label: "Interaction with",
      }
    : null;

  const { fields } = form.watch();

  if (fields.length === 0) return null;

  const screens = getScreensForOperation(
    {
      ...operation,
      fields: fields.filter((field) => field.isIncluded),
    },
    activeFieldPath,
  );
  if (ownerField) {
    screens[0]?.unshift(ownerField);
  }

  const totalPages = screens.length + 1;

  return (
    <div className="hidden flex-col items-center gap-4 md:flex">
      {screens.map((screen, index) => (
        <Device.Frame key={`review-screen-${index}`}>
          <ReviewScreen screen={screen} />
          <Device.Pagination current={index + 1} total={totalPages} />
        </Device.Frame>
      ))}
    </div>
  );
};

export default OperationScreens;
