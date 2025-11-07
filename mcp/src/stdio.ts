import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getServer } from './server.js';
import { config } from './config.js';
import { Server } from 'socket.io';

export async function startSTDIO() {
    const socketServer = new Server();
    socketServer.on('connection', (socket) => {
        console.log('a user connected:', socket.id);
    });
    const server = await getServer(socketServer);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}