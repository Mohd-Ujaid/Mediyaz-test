/**
 * EggPdfWithHeader
 * -----------------
 * Egg donor PDF — WITH the MEDIYAZ ART BANK letterhead image.
 * Use this component whenever you want the letterhead printed.
 *
 * It is a thin wrapper around PrintableEggRegistration with withHeader=true,
 * so all layout logic lives in one place (PrintableEggRegistration.tsx).
 */

import React from "react";
import PrintableEggRegistration from "./PrintableEggRegistration";

type Props = Omit<
  React.ComponentProps<typeof PrintableEggRegistration>,
  "withHeader"
>;

export function EggPdfWithHeader(props: Props) {
  return <PrintableEggRegistration {...props} withHeader={true} />;
}

export default EggPdfWithHeader;
