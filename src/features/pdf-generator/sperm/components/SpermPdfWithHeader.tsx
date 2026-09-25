/**
 * SpermPdfWithHeader
 * -------------------
 * Sperm donor PDF — WITH the MEDIYAZ ART BANK letterhead image.
 * Use this component whenever you want the letterhead printed.
 *
 * It is a thin wrapper around PrintableSpermRegistration with withHeader=true,
 * so all layout logic lives in one place (PrintableSpermRegistration.tsx).
 */

import React from "react";
import PrintableSpermRegistration from "./PrintableSpermRegistration";

type Props = Omit<
  React.ComponentProps<typeof PrintableSpermRegistration>,
  "withHeader"
>;

export function SpermPdfWithHeader(props: Props) {
  return <PrintableSpermRegistration {...props} withHeader={true} />;
}

export default SpermPdfWithHeader;
