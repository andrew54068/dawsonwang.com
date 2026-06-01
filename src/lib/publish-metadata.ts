export interface PublishPlatformLike {
  publishedAt?: string;
}

export interface PublishManifestLike {
  threads?: PublishPlatformLike;
  facebook?: PublishPlatformLike;
  linkedin?: PublishPlatformLike;
}

export function publishedAtForManifest(manifest?: PublishManifestLike): string | undefined {
  return manifest?.threads?.publishedAt
    ?? manifest?.facebook?.publishedAt
    ?? manifest?.linkedin?.publishedAt;
}

export function latestDefinedPublishedAt(values: Iterable<string | undefined | null>): string | undefined {
  return Array.from(values)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}

export function toRfc822IfPresent(value?: string | null): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toUTCString();
}
