import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getServer } from './server.js';
import { config, PORT } from './config.js';
import { Server } from 'socket.io';
import http from 'http';

export async function startSTDIO() {
    // Suppress all console output in STDIO mode to avoid breaking MCP protocol
    // The MCP protocol requires that only JSON-RPC messages are sent over stdin/stdout
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    // Redirect console methods to no-op in STDIO mode
    console.error = () => {};
    console.log = () => {};
    console.warn = () => {};
    
    try {
        const httpServer = http.createServer();
        const socketServer = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "OPTIONS"],
                allowedHeaders: ["*"],
                credentials: false
            },
            transports: ['polling', 'websocket'],
            allowUpgrades: true,
            cookie: false,
            serveClient: false,
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        const server = await getServer(socketServer);
        const transport = new StdioServerTransport();
        await server.connect(transport);
    } catch (error) {
        // Don't log to console in STDIO mode as it breaks the MCP protocol
        // Errors will be handled by the MCP server's error handling
        throw error;
    } finally {
        // Restore console methods (though we shouldn't reach here in normal operation)
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
    }
}