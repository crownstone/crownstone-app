type ConnectionState = "INITIALIZING" | "CONNECTING" | "CONNECTION_FAILED" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED" | "WAITING_FOR_COMMANDS" | "PERFORMING_COMMAND"

type CommandType = "DIRECT" | "MESH"

interface commandOptions {
  commanderId?:   string,
  sphereId:       string | null,
  commandType?:   CommandType,
  commandTargets: string[],   // this can be a number of meshIds or handles
  private?: boolean,
  minConnections?: number
  timeout?: number // seconds
}

interface SessionInteractionModule {
  canActivate:    () => boolean
  willActivate:   () => void
  isDeactivated:  () => void
  isConnected:    () => void
  cleanup:        () => void
  connectionFailed: (err:any) => void,
}

interface CommandQueueMap {
  direct: {[handle: string]        : BleCommand[]}
  mesh:   {[meshNetworkId: string] : BleCommand[]}
}
interface PromiseContainer {
  resolve: (data?: any) => void,
  reject:  (err:   any) => void
}

interface BleCommand {
  id:           string,
  linkedId:     string,           // the linkedId refers to mesh_relay commands which can be cancelled if the direct command has succeeded
  command:      commandInterface,
  promise:      PromiseContainer,
  attemptingBy: string[],
  executedBy:   string[],

  // injected the command options here.
  commanderId?:   string,
  sphereId:       string | null,
  commandType?:   CommandType,
  commandTarget:  string,   // this can be a meshId, a handleId or a sphereId
  endTarget?:     string,   // in case that a command can be convayed via the mesh (like a multiswitch) the commandTarget is a meshId
                            // in order to relay the command to a target, the endTarget is a handle of the endTarget of the command.
  private?: boolean,
  minConnections?: number
  startTime: number,
  timeout?: number // seconds
}


