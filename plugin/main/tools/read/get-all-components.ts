import type { GetAllComponentsParams } from "@shared/types";
import { ToolResult } from "../tool-result";
import { serializeComponent } from "serialization/serialize-component";

export async function getAllComponents(args: GetAllComponentsParams): Promise<ToolResult> {
    const components = figma.root.findAllWithCriteria({
        types: ["COMPONENT", "COMPONENT_SET"],
    });

    const query = args.query?.toLowerCase().trim();
    const filtered = query
        ? components.filter((component) => component.name.toLowerCase().includes(query))
        : components;

    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const items = filtered
        .slice(offset, offset + limit)
        .map((component) =>
            serializeComponent(component as ComponentNode | ComponentSetNode, {
                includeProperties: args.includeProperties,
            })
        );

    return {
        isError: false,
        content: {
            total: filtered.length,
            offset,
            limit,
            items,
            truncated: offset + limit < filtered.length ? true : undefined,
        },
    };
}
