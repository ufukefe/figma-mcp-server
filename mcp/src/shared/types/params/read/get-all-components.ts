import { z } from "zod";

export const GetAllComponentsParamsSchema = z.object({
    /**
     * Optional substring match on component name.
     */
    query: z.string().min(1).optional(),
    /**
     * Pagination.
     */
    offset: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).max(500).optional(),
    /**
     * If true, includes full `componentPropertyDefinitions` for each component.
     */
    includeProperties: z.boolean().optional(),
});

export type GetAllComponentsParams = z.infer<typeof GetAllComponentsParamsSchema>;
