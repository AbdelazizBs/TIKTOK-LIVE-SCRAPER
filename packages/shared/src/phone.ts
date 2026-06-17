import { parsePhoneNumberFromString } from "libphonenumber-js";

export type ExtractedPhoneLead = {
  phoneE164: string;
  displayPhone: string;
  cleanContent: string;
  originalContent: string;
  isPotentialTypo: boolean;
  rawPhoneCandidate: string;
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
  /(?<![A-Za-z\d٠-٩۰-۹])(?:\+?\s*(?:216|٢١٦|۲۱۶)[\s().-]*)?(?:[\d٠-٩۰-۹][\s().-]*){8}(?![A-Za-z\d٠-٩۰-۹])/g;

export function normalizeArabicDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (digit) => digitMap[digit] ?? digit);
}

export function extractTunisiaPhoneLead(
  input: string,
): ExtractedPhoneLead | null {
  const originalContent = input;
  const normalizedInput = normalizeArabicDigits(input);
  const candidates = [
    ...Array.from(normalizedInput.matchAll(candidatePattern)).map((match) => ({
      isPotentialTypo: false,
      rawCandidate: match[0],
      startIndex: match.index,
    })),
    ...findTypoCandidates(normalizedInput),
  ];

  for (const candidate of candidates) {
    const normalizedPhone = normalizePhoneCandidate(candidate.rawCandidate);

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
      cleanContent: cleanMatchedPhone(
        normalizedInput,
        candidate.startIndex,
        candidate.rawCandidate,
      ),
      originalContent,
      isPotentialTypo: candidate.isPotentialTypo,
      rawPhoneCandidate: candidate.rawCandidate,
    };
  }

  return null;
}

function normalizePhoneCandidate(candidate: string): string | null {
  const compact = candidate.replace(/[^\d+]/g, "");

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

function findTypoCandidates(input: string) {
  const tokens = Array.from(input.matchAll(/\S+/g)).map((match) => ({
    text: match[0],
    startIndex: match.index ?? 0,
  }));
  const candidates: Array<{
    isPotentialTypo: true;
    rawCandidate: string;
    startIndex: number;
  }> = [];

  for (let start = 0; start < tokens.length; start += 1) {
    for (
      let end = start;
      end < Math.min(tokens.length, start + 4);
      end += 1
    ) {
      const rawCandidate = input.slice(
        tokens[start].startIndex,
        tokens[end].startIndex + tokens[end].text.length,
      );
      const digits = rawCandidate.replace(/\D/g, "");
      const containsLetters = /[A-Za-z]/.test(rawCandidate);

      if (!containsLetters) {
        continue;
      }

      if (digits.length !== 8 && !/^216\d{8}$/.test(digits)) {
        continue;
      }

      candidates.push({
        isPotentialTypo: true,
        rawCandidate,
        startIndex: tokens[start].startIndex,
      });
    }
  }

  return candidates;
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
