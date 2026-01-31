import { z } from "zod";

export const GetPagesParamsSchema = z.object({
    /**
     * If true, includes top-level children for each page (compact refs).
     */
    includeChildren: z.boolean().optional(),
    /**
     * Max children returned per page when `includeChildren` is true.
     */
    maxChildren: z.number().int().min(0).max(500).optional(),
});

export type GetPagesParams = z.infer<typeof GetPagesParamsSchema>;
