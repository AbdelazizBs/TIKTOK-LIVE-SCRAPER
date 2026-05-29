# Test Plan

## Unit tests

### Phone parser

Test:

```txt
98421295
98 421 295
98-421-295
+21698421295
+216 98 421 295
21698421295
٩٨٤٢١٢٩٥
robe noire taille M 98421295
```

Must return normalized phone and clean content.

### Invalid comments

Test:

```txt
prix?
hello
123
999999999999
```

Must return null.

## Integration tests

### Duplicate number

Input comments:

```txt
robe 98421295
taille M 98421295
ok 98421295
```

Expected:

```txt
leads count = 1
comment_count = 3
lead_comments count = 3
latest_clean_content = ok
```

### New comment after call

1. Insert lead.
2. Mark called.
3. Insert another comment with same phone.

Expected:

```txt
has_new_comment_after_call = true
```

## UI tests manually

- Login works.
- Create live session works.
- Lead table filters work.
- Copy phone works.
- Comments drawer opens.
- Arabic direction works.
- French labels work.
- CSV export downloads.
- Mobile view usable.

## Load test for tonight

Use mock collector to insert 1000 comments with 300 unique numbers and duplicates.

Expected: dashboard still loads, DB has 300 leads, lead_comments stores all valid phone comments.
