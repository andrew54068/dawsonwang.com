// Single source of truth for email validation, shared by the server schema
// (inquiry-schema.ts) and the client-side form gate (InquiryForm.astro).
// One definition guarantees the browser can't accept an address the server
// rejects, or vice versa — the mismatch that let `a@b.c` reach the API and
// bounce back as a bare "Invalid payload".
//
// This is Zod 4's default email regex copied verbatim, so the constant can be
// bundled into the browser without pulling Zod into the client. The schema
// feeds it back into `z.email({ pattern })`, so both sides enforce exactly
// this — notably a TLD of 2+ characters.
export const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
