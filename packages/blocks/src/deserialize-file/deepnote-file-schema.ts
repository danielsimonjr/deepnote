import { z } from 'zod'
import { blockMetadataSchema } from './block-metadata-schemas'

// Output schema - outputs can have various structures depending on type
// Using z.unknown() is safer than z.any() as it requires explicit type assertions
export const blockOutputSchema = z
  .object({
    data: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
    name: z.string().optional(),
    output_type: z.string().optional(),
    text: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough() // Allow additional fields for backward compatibility

export const deepnoteBlockSchema = z.object({
  blockGroup: z.string().optional(),
  content: z.string().optional(),
  executionCount: z.number().optional(),
  id: z.string(),
  metadata: blockMetadataSchema.optional(),
  outputs: z.array(blockOutputSchema).optional(),
  sortingKey: z.string(),
  type: z.string(),
  version: z.number().optional(),
})

export type DeepnoteBlock = z.infer<typeof deepnoteBlockSchema>

export const deepnoteFileSchema = z.object({
  metadata: z.object({
    checksum: z.string().optional(),
    createdAt: z.string(),
    exportedAt: z.string().optional(),
    modifiedAt: z.string().optional(),
  }),

  project: z.object({
    id: z.string(),

    initNotebookId: z.string().optional(),
    integrations: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
        })
      )
      .optional(),
    name: z.string(),
    notebooks: z.array(
      z.object({
        blocks: z.array(deepnoteBlockSchema),
        executionMode: z.enum(['block', 'downstream']).optional(),
        id: z.string(),
        isModule: z.boolean().optional(),
        name: z.string(),
        workingDirectory: z.string().optional(),
      })
    ),
    settings: z
      .object({
        environment: z
          .object({
            customImage: z.string().optional(),
            pythonVersion: z.string().optional(),
          })
          .optional(),
        requirements: z.array(z.string()).optional(),
        sqlCacheMaxAge: z.number().optional(),
      })
      .optional(),
  }),
  version: z.string(),
})

export type DeepnoteFile = z.infer<typeof deepnoteFileSchema>
