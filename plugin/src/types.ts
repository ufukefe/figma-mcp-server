import { EventHandler } from '@create-figma-plugin/utilities'
import { FromPluginMessage } from '@shared/types'

export interface InsertCodeHandler extends EventHandler {
  name: 'INSERT_CODE'
  handler: (code: string) => void
}

export interface StartTaskHandler extends EventHandler {
  name: 'START_TASK'
  taskId: string
  command: string
  args: any
}

export interface TaskFinishedHandler extends EventHandler, FromPluginMessage {
  name: 'TASK_FINISHED'
}

export interface TaskFailedHandler extends EventHandler, FromPluginMessage {
  name: 'TASK_FAILED'
}