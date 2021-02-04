type ConnectionState = "INITIALIZING" | "CONNECTING" | "CONNECTION_FAILED" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED"

type CommandType = "DIRECT" | "MESH" | "SPHERE" | "MESH_RELAY"
interface commandOptions {
  commanderId?:   string,
  commandType?:   CommandType,
  commandTargets: string[], // this can be a meshId, a handleId or a sphereId, or a set thereof
  endTarget?:     string,   // in case that a command can be convayed via the mesh (like a multiswitch) the commandTarget is a meshId
                            // in order to relay the command to a target, the endTarget is a handle of the endTarget of the command.
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