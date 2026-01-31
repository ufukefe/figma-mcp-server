import type { GetNodeInfoParams } from "@shared/types";
import { serializeNode } from "../../serialization/serialization";
import { ToolResult } from "../tool-result";

export async function getNodeInfo(args: GetNodeInfoParams): Promise<ToolResult> {
    const node = await figma.getNodeByIdAsync(args.id);
    if (node) {
        const serializedNode = serializeNode(node as SceneNode, {
            format: args.format ?? "summary",
            depth: args.depth ?? 0,
            maxChildren: args.maxChildren ?? 50,
            maxTextChars: args.maxTextChars ?? 200,
            includeFills: args.includeFills,
            includeStrokes: args.includeStrokes,
        });
        return {
            isError: false,
            content: serializedNode
        };
    }
    return {
        isError: true,
        content: "Node not found"
    };
}
