import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { TaskResult } from "../task-manager.js";

function parsePositiveInt(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildTruncatedResult(payloadText: string, maxChars: number) {
    const previewChars = Math.min(2000, maxChars);
    return {
        truncated: true,
        maxChars,
        originalChars: payloadText.length,
        preview: payloadText.slice(0, previewChars),
        hint: "Reduce depth/limits or request summary output.",
    };
}

function stringifyToolContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (content === undefined) return "";
    try {
        return JSON.stringify(content);
    } catch (error) {
        return error instanceof Error ? error.message : String(content);
    }
}

function guardToolPayload(content: unknown, payloadText: string): string {
    const maxChars =
        parsePositiveInt(process.env.MCP_MAX_TOOL_RESPONSE_CHARS) ??
        parsePositiveInt(process.env.FIGMA_MCP_MAX_TOOL_RESPONSE_CHARS) ??
        20000;

    if (payloadText.length <= maxChars) return payloadText;

    // Best-effort structured truncation for common shapes.
    const maxItems =
        parsePositiveInt(process.env.MCP_MAX_TOOL_RESPONSE_ITEMS) ??
        parsePositiveInt(process.env.FIGMA_MCP_MAX_TOOL_RESPONSE_ITEMS) ??
        50;

    if (Array.isArray(content)) {
        return JSON.stringify({
            truncated: true,
            maxChars,
            originalItems: content.length,
            returnedItems: Math.min(content.length, maxItems),
            items: content.slice(0, maxItems),
        });
    }

    if (
        content &&
        typeof content === "object" &&
        "items" in content &&
        Array.isArray((content as any).items)
    ) {
        const items = (content as any).items as unknown[];
        return JSON.stringify({
            ...(content as any),
            truncated: true,
            maxChars,
            originalItems: items.length,
            returnedItems: Math.min(items.length, maxItems),
            items: items.slice(0, maxItems),
        });
    }

    return JSON.stringify(buildTruncatedResult(payloadText, maxChars));
}

export async function safeToolProcessor(task: Promise<TaskResult>): Promise<CallToolResult> {
    try {
        const result = await task;
        const payloadText = guardToolPayload(result.content, stringifyToolContent(result.content));
        return {
            content: [{
                type: "text",
                text: payloadText
            }],
            isError: result.isError
        } as CallToolResult;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return {
            content: [{
                type: "text",
                text: errorMessage
            }],
            isError: true
        } as CallToolResult;
    }

}
