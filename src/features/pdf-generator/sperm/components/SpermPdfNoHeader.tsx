/**
 * SpermPdfNoHeader
 * -----------------
 * Sperm donor PDF — WITHOUT the letterhead image (plain white background).
 * Use this for drafts, internal copies, or pre-printed letterhead paper.
 *
 * It is a thin wrapper around PrintableSpermRegistration with withHeader=false,
 * so all layout logic lives in one place (PrintableSpermRegistration.tsx).
 */

import React from "react";
import PrintableSpermRegistration from "./PrintableSpermRegistration";

type Props = Omit<
  React.ComponentProps<typeof PrintableSpermRegistration>,
  "withHeader"
>;

export function SpermPdfNoHeader(props: Props) {
  return <PrintableSpermRegistration {...props} withHeader={false} />;
}

export default SpermPdfNoHeader;
