import { parsePhoneNumberFromString } from "libphonenumber-js";

export type ExtractedPhoneLead = {
  phoneE164: string;
  displayPhone: string;
  cleanContent: string;
  originalContent: string;
};

const digitMap: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const candidatePattern =
  /(?<![\d٠-٩۰-۹])(?:\+?\s*(?:216|٢١٦|۲۱۶)[\s().-]*)?(?:[\d٠-٩۰-۹][\s().-]*){8}(?![\d٠-٩۰-۹])/g;

export function normalizeArabicDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (digit) => digitMap[digit] ?? digit);
}

export function extractTunisiaPhoneLead(
  input: string,
): ExtractedPhoneLead | null {
  const originalContent = input;
  const normalizedInput = normalizeArabicDigits(input);
  const candidates = Array.from(normalizedInput.matchAll(candidatePattern));

  for (const match of candidates) {
    const rawCandidate = match[0];
    const normalizedPhone = normalizePhoneCandidate(rawCandidate);

    if (!normalizedPhone) {
      continue;
    }

    const phone = parsePhoneNumberFromString(normalizedPhone, "TN");

    if (!phone?.isValid() || phone.country !== "TN") {
      continue;
    }

    const phoneE164 = phone.number;

    if (!/^\+216\d{8}$/.test(phoneE164)) {
      continue;
    }

    return {
      phoneE164,
      displayPhone: formatTunisiaDisplayPhone(phoneE164),
      cleanContent: cleanMatchedPhone(normalizedInput, match.index, rawCandidate),
      originalContent,
    };
  }

  return null;
}

function normalizePhoneCandidate(candidate: string): string | null {
  const compact = candidate.replace(/[\s().-]/g, "");

  if (/^\+216\d{8}$/.test(compact)) {
    return compact;
  }

  if (/^216\d{8}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^\d{8}$/.test(compact)) {
    return `+216${compact}`;
  }

  return null;
}

function cleanMatchedPhone(
  normalizedInput: string,
  startIndex: number | undefined,
  rawCandidate: string,
): string {
  if (startIndex === undefined) {
    return normalizedInput.trim().replace(/\s+/g, " ");
  }

  return `${normalizedInput.slice(0, startIndex)} ${normalizedInput.slice(
    startIndex + rawCandidate.length,
  )}`
    .replace(/\s+/g, " ")
    .trim();
}

function formatTunisiaDisplayPhone(phoneE164: string): string {
  return phoneE164.replace(/^\+216(\d{2})(\d{3})(\d{3})$/, "+216 $1 $2 $3");
}
