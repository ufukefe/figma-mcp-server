import { serializePage } from "serialization/serialize-page";
import { ToolResult } from "../tool-result";
import type { GetPagesParams } from "@shared/types";

export async function getPages(args: GetPagesParams): Promise<ToolResult> {
    const pages = figma.root.findAllWithCriteria({
        types: ["PAGE"],
    });
    const serializedPages = pages.map((page) =>
        serializePage(page as PageNode, {
            includeChildren: args.includeChildren,
            maxChildren: args.maxChildren,
        })
    );
    return {
        isError: false,
        content: serializedPages,
    };
}
