import * as React from "react";

import { Device } from "~/components/devices/device";
import { ReviewScreen } from "~/components/devices/reviewScreen";
import { TitleScreen } from "~/components/devices/titleScreen";
import { SignScreen } from "~/components/devices/signScreen";
import { DisplayItem, type Screen } from "~/shared/getScreensForOperation";
import { type Erc7730 } from "~/store/types";

const operationScreens = (
  screens: Screen[],
  metadata: {
    operationName: string;
    interpolatedIntent?: string;
    metadata: Erc7730["metadata"] | null;
  },
) => {
  const totalPages = screens.length + 2;
  const displayName = metadata?.interpolatedIntent
    ? metadata.interpolatedIntent
    : (metadata?.operationName ?? "{functionName}");
  const owner = metadata?.metadata?.owner;
  const ownerField: DisplayItem | null = owner
    ? {
        displayValue: owner,
        isActive: true,
        label: "Interaction with",
      }
    : null;

  if (ownerField) {
    screens[0]?.unshift(ownerField);
  }

  const titleScreen = (
    <>
      <TitleScreen
        functionName={displayName}
        type={"transaction"}
      />
      <Device.Pagination current={1} total={totalPages} />
    </>
  );

  const reviewScreens = screens.map((screen, index) => (
    <>
      <ReviewScreen screen={screen} />
      <Device.Pagination current={index + 2} total={totalPages} />
    </>
  ));

  const signScreen = (
    <>
      <SignScreen
        intent={displayName}
        type={"transaction"}
      />
      <Device.Pagination current={totalPages} total={totalPages} />
    </>
  );

  return [titleScreen, ...reviewScreens, signScreen];
};

export default operationScreens;
