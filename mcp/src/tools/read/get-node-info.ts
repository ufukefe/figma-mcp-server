import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { TaskManager } from "../../task-manager.js";
import { GetNodeInfoParamsSchema, type GetNodeInfoParams } from "../../shared/types/index.js";
import { safeToolProcessor } from "../safe-tool-processor.js";

export function getNodeInfo(server: McpServer, taskManager: TaskManager) {
    server.tool(
        "get-node-info",
        "Get information about a node (token-efficient by default). Use `format: \"full\"` or `depth` for more detail.",
        GetNodeInfoParamsSchema.shape,
        async (params: GetNodeInfoParams) => {
            return await safeToolProcessor(
                taskManager.runTask("get-node-info", params)
            );
        }
    )
}
