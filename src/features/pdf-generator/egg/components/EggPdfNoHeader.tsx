/**
 * EggPdfNoHeader
 * ---------------
 * Egg donor PDF — WITHOUT the letterhead image (plain white background).
 * Use this component for drafts, internal copies, or when printing on
 * pre-printed letterhead paper.
 *
 * It is a thin wrapper around PrintableEggRegistration with withHeader=false,
 * so all layout logic lives in one place (PrintableEggRegistration.tsx).
 */

import React from "react";
import PrintableEggRegistration from "./PrintableEggRegistration";

type Props = Omit<
  React.ComponentProps<typeof PrintableEggRegistration>,
  "withHeader"
>;

export function EggPdfNoHeader(props: Props) {
  return <PrintableEggRegistration {...props} withHeader={false} />;
}

export default EggPdfNoHeader;
