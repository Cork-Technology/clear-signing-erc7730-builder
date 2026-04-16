/**
 * Ledger device display constraints for clear signing.
 *
 * These constraints are derived from the device preview components
 * (flex.tsx, stax.tsx, device.tsx) and screen-generation logic
 * (getScreensForOperation.tsx, utils.ts).
 *
 * They can be used programmatically to validate ERC-7730 descriptors
 * against real device limitations before submitting.
 */

export interface DeviceConstraints {
  /** Device model name */
  name: string;
  /** Usable display area in CSS pixels (the webapp renders at these sizes) */
  display: { width: number; height: number };
  /** Font sizes used on-device for different text roles */
  fontSizes: {
    /** Field labels ("Amount", "Recipient", etc.) */
    content: { size: number; lineHeight: number };
    /** Button text ("Reject", etc.) */
    action: { size: number; lineHeight: number };
    /** Field values, operation summary titles */
    heading: { size: number; lineHeight: number };
  };
}

export const FLEX_CONSTRAINTS: DeviceConstraints = {
  name: "Ledger Flex",
  display: { width: 240, height: 300 },
  fontSizes: {
    content: { size: 13, lineHeight: 18 },
    action: { size: 12, lineHeight: 12 },
    heading: { size: 18, lineHeight: 20 },
  },
};

export const STAX_CONSTRAINTS: DeviceConstraints = {
  name: "Ledger Stax",
  display: { width: 200, height: 335 },
  fontSizes: {
    content: { size: 10, lineHeight: 14 },
    action: { size: 10, lineHeight: 14 },
    heading: { size: 14, lineHeight: 14 },
  },
};

/** Maximum number of field rows displayed per review screen */
export const FIELDS_PER_SCREEN = 3;

/**
 * Maximum character length for field labels before truncation.
 * The builder uses 20 in screen generation (getScreensForOperation)
 * and a default of 30 in the truncateLabel utility.
 * The stricter limit (20) applies to device preview rendering.
 */
export const LABEL_MAX_LENGTH = 20;

/** Default max length used by the truncateLabel utility */
export const LABEL_MAX_LENGTH_DEFAULT = 30;

/**
 * Screen layout for a single operation:
 *   1. Title screen  — "Review transaction to [functionName]"
 *   2..N. Review screens — FIELDS_PER_SCREEN fields each
 *   N+1. Sign screen — "Sign transaction to [intent]?" + Hold to Sign
 *
 * Total screens = 2 + ceil(includedFieldCount / FIELDS_PER_SCREEN)
 */
export function computeScreenCount(includedFieldCount: number): number {
  return 2 + Math.ceil(includedFieldCount / FIELDS_PER_SCREEN);
}

/**
 * Approximate max characters that fit on a single line of heading text
 * on each device, based on display width and average character width
 * (roughly 0.55× the font size for the Geist Sans font at these sizes).
 */
export function approxHeadingCharsPerLine(
  device: DeviceConstraints,
): number {
  const avgCharWidth = device.fontSizes.heading.size * 0.55;
  // Subtract horizontal padding (Flex: 16px each side, Stax: 12px each side)
  const padding = device.name === "Ledger Stax" ? 24 : 32;
  return Math.floor((device.display.width - padding) / avgCharWidth);
}

/**
 * Approximate max characters that fit on a single line of content text.
 */
export function approxContentCharsPerLine(
  device: DeviceConstraints,
): number {
  const avgCharWidth = device.fontSizes.content.size * 0.55;
  const padding = device.name === "Ledger Stax" ? 24 : 32;
  return Math.floor((device.display.width - padding) / avgCharWidth);
}

/**
 * Validate a label against device constraints.
 * Returns warnings if the label would be truncated.
 */
export function validateLabel(label: string): string[] {
  const warnings: string[] = [];
  if (label.length > LABEL_MAX_LENGTH) {
    warnings.push(
      `Label "${label}" (${label.length} chars) exceeds ${LABEL_MAX_LENGTH}-char device limit and will be truncated to "${label.slice(0, LABEL_MAX_LENGTH - 3)}..."`,
    );
  }
  return warnings;
}

/**
 * Validate an entire operation's fields against device constraints.
 * Returns an array of warnings/issues found.
 */
export function validateOperation(operation: {
  intent?: string;
  fields: Array<{ label?: string | null; format?: string }>;
}): string[] {
  const warnings: string[] = [];

  const includedFields = operation.fields.filter(
    (f) => f.label !== undefined && f.label !== null && f.label !== "",
  );

  const screenCount = computeScreenCount(includedFields.length);
  if (screenCount > 8) {
    warnings.push(
      `Operation has ${includedFields.length} fields across ${screenCount} screens — users may abandon signing with this many screens.`,
    );
  }

  for (const field of includedFields) {
    if (field.label) {
      warnings.push(...validateLabel(field.label));
    }
  }

  if (operation.intent) {
    const flexChars = approxHeadingCharsPerLine(FLEX_CONSTRAINTS);
    if (operation.intent.length > flexChars * 2) {
      warnings.push(
        `Intent "${operation.intent}" (${operation.intent.length} chars) may overflow the title screen on Flex (≈${flexChars} chars/line × 2 lines).`,
      );
    }
  }

  return warnings;
}
