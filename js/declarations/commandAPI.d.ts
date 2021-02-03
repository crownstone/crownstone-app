type ConnectionState = "INITIALIZING" | "CONNECTING" | "CONNECTION_FAILED" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED"

type CommandType = "SINGLE" | "MESH" | "NEARBY" | "LOCALIZATION" | "SPHERE"
interface CommandOptions {
  commandId?: string,
  type: CommandType,
  target: string[],
  private?: boolean,
  minConnections?: number
  timeout?: number // seconds
}

interface SessionInteractionModule {
  canActivate:  () => boolean
  willActivate: () => void
  isConnected:  () => void
  connectionFailed: (err:any) => void,
  cleanup:      () => void
}