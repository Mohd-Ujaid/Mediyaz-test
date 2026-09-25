// ==========================================
// SPERM PDF GENERATOR SUB-FEATURE
// ==========================================
export * as SpermPdf from "./sperm";
export {
  SpermDonorRegistrationPdfDocument,
  PrintableSpermRegistration,
  PrintableSpermAffidavit,
  SPERM_SECTIONS,
} from "./sperm";
export type { SpermPdfDocumentProps } from "./sperm";

// ==========================================
// EGG PDF GENERATOR SUB-FEATURE
// ==========================================
export * as EggPdf from "./egg";
export {
  EggDonorRegistrationPdfDocument,
  PrintableEggRegistration,
  PrintableEggAffidavit,
  EGG_SECTIONS,
} from "./egg";
export type { EggPdfDocumentProps } from "./egg";

// ==========================================
// UNIVERSAL / DELEGATOR COMPONENTS
// ==========================================
export { DonorRegistrationPdfDocument } from "./components/DonorRegistrationPdfDocument";
export { default as PrintableRegistrationDocument } from "./components/PrintableRegistration";
export * from "./shared/pdf-utils";
export * from "./shared/pdf-styles";
