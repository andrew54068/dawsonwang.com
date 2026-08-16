// git-staged.ts — "which paths are already staged?", asked in a way that
// survives a trimming git runner.
//
// This exists because of a real bug. deploy-local.ts's auto-commit guard used
// `git status --porcelain`, whose format is COLUMN-SENSITIVE: the first column
// is the index status and the second the worktree status, so an unstaged edit
// is ' M path' — a leading SPACE is the only thing marking it unstaged. The
// repo's git() helper trims its output, which turned ' M path' into 'M path'.
// Every unstaged edit then read as staged (and slice(3) ate the path's first
// character), so the guard blocked on a clean tree and silently refused to
// commit new topic tags.
//
// `git diff --name-only --cached` lists one bare path per line, so leading
// whitespace carries no meaning and trimming cannot change the answer. Prefer
// it — or `--porcelain -z` — over column-parsing anywhere output may be trimmed.

export type GitRunner = (args: string[]) => string;

/**
 * Paths staged in the index (relative to HEAD), excluding `exclude`.
 *
 * Untracked files and unstaged modifications are deliberately NOT reported:
 * a `git add <path> && git commit` (no -a) cannot sweep them into a commit, so
 * treating them as blockers would stall automation on any dirty working tree.
 */
export function stagedPathsOtherThan(git: GitRunner, exclude: string): string[] {
  return git(['diff', '--name-only', '--cached'])
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0 && p !== exclude);
}
