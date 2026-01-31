import { z } from "zod";

export const GetNodeInfoParamsSchema = z.object({
    id: z.string(),
    /**
     * Controls how much data is returned. `summary` is optimized for token usage.
     */
    format: z.enum(["summary", "full"]).optional(),
    /**
     * Child traversal depth (0 = no children).
     */
    depth: z.number().int().min(0).max(3).optional(),
    /**
     * Max children returned per node when `depth` > 0.
     */
    maxChildren: z.number().int().min(0).max(500).optional(),
    /**
     * Max characters returned for TEXT nodes.
     */
    maxTextChars: z.number().int().min(0).max(5000).optional(),
    includeFills: z.boolean().optional(),
    includeStrokes: z.boolean().optional(),
});

export type GetNodeInfoParams = z.infer<typeof GetNodeInfoParamsSchema>;
