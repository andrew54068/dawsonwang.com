import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import path from 'node:path';
import { loadAllDays } from './lib/content-loader';

const CONTENT_DIR = path.resolve(import.meta.dirname, '../100days/content');

const days = defineCollection({
  loader: async () => {
    const all = await loadAllDays(CONTENT_DIR);
    return all.map(d => ({
      id: String(d.dayNumber),
      ...d,
    }));
  },
  schema: z.object({
    dayNumber: z.number(),
    subtitle: z.string(),
    body: z.string(),
    contentDir: z.string(),
    slideFiles: z.array(z.string()),
    shareFiles: z.array(z.string()),
    coverImage: z.string().optional(),
    manifest: z.any().optional(),
  }),
});

export const collections = { days };
