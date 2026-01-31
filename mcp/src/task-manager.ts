import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { generateUUID } from "./utils.js";

type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "timed_out";

export interface TaskResult {
    isError: boolean;
    content?: any;
}

interface Task {
    id: string;
    command: string;
    args: any;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
    resolve: (result: TaskResult) => void;
    reject: (result: TaskResult) => void;
    result: any;
    timeoutId?: ReturnType<typeof setTimeout> | undefined;
}

// Task manager is responsible for managing the tasks.
// Task could be added, updated and removed.
// Events are raised when a task is added or updated
export class TaskManager {
    private tasks = new Map<string, Task>();

    private getTaskTimeoutMs(): number {
        const raw = process.env.MCP_TASK_TIMEOUT_MS ?? process.env.FIGMA_MCP_TASK_TIMEOUT_MS;
        const parsed = raw ? Number.parseInt(raw, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
    }

    private scheduleCleanup(id: string) {
        // Keep completed tasks briefly so late plugin responses can be ignored quietly.
        const timeout = setTimeout(() => this.tasks.delete(id), 60000);
        // Avoid keeping the process alive solely for cleanup timers.
        (timeout as any).unref?.();
    }


    public runTask<TResult, TArgs>(
        command: string,
        args: TArgs): Promise<TResult> {
        const id = generateUUID();
        const promise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.updateTask(id, { error: "Task timed out" }, "timed_out");
            }, this.getTaskTimeoutMs());

            this.addTask(id, command, args, resolve, reject, timeoutId);
        });
        return promise as Promise<any>;
    }

    public addTask<TArgs>(id: string,
        command: string,
        args: TArgs,
        resolve: (result: any) => void,
        reject: (result: any) => void,
        timeoutId?: ReturnType<typeof setTimeout>) {
        const task: Task = {
            id: id,
            command: command,
            args: args,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            resolve: resolve,
            reject: reject,
            result: null,
            timeoutId,
        };
        this.tasks.set(id, task);
        // Call the onTaskAdded event if subscriber(s) exist
        if (typeof this._onTaskAddedCallback === "function") {
            this._onTaskAddedCallback(task);
        }
    }

    private _onTaskAddedCallback?: (task: Task) => void;

    // Register a callback for when a task is added
    public onTaskAdded(callback: (task: Task) => void) {
        this._onTaskAddedCallback = callback;
    }

    public updateTask(id: string, result: any, status: TaskStatus) {

        const task = this.tasks.get(id);
        if (task) {
            if (task.status === "completed" || task.status === "failed" || task.status === "timed_out") {
                // Ignore late updates (e.g., plugin response after timeout).
                return;
            }

            task.status = status;
            task.updatedAt = new Date();
        }
        else {
            console.error("Attempt to update task that does not exist", id, result, status);
            return;
        }

        if (task.timeoutId) {
            clearTimeout(task.timeoutId);
            task.timeoutId = undefined;
        }

        if (status === 'completed') {
            task?.resolve({
                isError: false,
                content: result,
            });
            this.scheduleCleanup(id);
        } else if (status === 'failed'
            || status === 'timed_out'
        ) {
            task?.resolve({
                isError: true,
                content: result,
            });
            this.scheduleCleanup(id);
        }
    }
}
