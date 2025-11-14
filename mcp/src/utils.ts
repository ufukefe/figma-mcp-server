export function generateUUID(): string {
    // Do not use crypto.randomUUID() directly in tests, as it can cause issues with snapshot testing.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Safe logger that only logs when not in STDIO mode to avoid breaking MCP protocol
export function safeLogError(...args: any[]): void {
    const transport = process.env.TRANSPORT?.toLowerCase();
    if (transport !== 'stdio') {
        console.error(...args);
    }
}

export function safeLog(...args: any[]): void {
    const transport = process.env.TRANSPORT?.toLowerCase();
    if (transport !== 'stdio') {
        console.log(...args);
    }
}