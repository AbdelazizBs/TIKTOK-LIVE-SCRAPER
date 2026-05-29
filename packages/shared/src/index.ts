import { z } from "zod";

export {
  extractTunisiaPhoneLead,
  normalizeArabicDigits,
  type ExtractedPhoneLead,
} from "./phone.js";

export const leadStatuses = [
  "new",
  "called",
  "confirmed",
  "no_answer",
  "cancelled",
  "wrong_number",
  "duplicate",
  "archived",
] as const;

export const leadStatusSchema = z.enum(leadStatuses);

export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const supportedLocales = ["en", "ar", "fr"] as const;

export const localeSchema = z.enum(supportedLocales);

export type Locale = z.infer<typeof localeSchema>;
