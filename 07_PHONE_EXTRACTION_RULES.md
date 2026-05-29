# Phone Extraction Rules

## Country

Tunisia only.

## Accepted formats

```txt
98421295
98 421 295
98-421-295
98.421.295
+21698421295
+216 98 421 295
21698421295
216 98 421 295
٩٨٤٢١٢٩٥
```

## Output

All numbers normalize to:

```txt
+21698421295
```

## Splitting rule

Input:

```txt
robe noire taille M 98421295
```

Output:

```json
{
  "phoneE164": "+21698421295",
  "displayPhone": "+216 98 421 295",
  "cleanContent": "robe noire taille M",
  "originalContent": "robe noire taille M 98421295"
}
```

## Candidate strategy

1. Normalize Arabic digits to Latin digits.
2. Find possible number candidates.
3. Remove spaces, dashes, dots, parentheses.
4. If candidate starts with `+216`, keep it.
5. If candidate starts with `216` and has 11 digits, convert to `+216XXXXXXXX`.
6. If candidate has exactly 8 digits, convert to `+216XXXXXXXX`.
7. Validate with `libphonenumber-js` using country `TN`.
8. Remove the matched phone substring from the comment to create `cleanContent`.
9. Collapse spaces.

## Multiple numbers in one comment

MVP decision: use the first valid phone number and store original comment.

## Repeated same phone

Same live session + same phone hash = one lead.

Update behavior:

```txt
comment_count += 1
latest_comment = original comment
latest_clean_content = clean content
last_comment_at = comment timestamp
append lead_comments row
```

If `last_called_at` exists and new comment timestamp is after it:

```txt
has_new_comment_after_call = true
```
