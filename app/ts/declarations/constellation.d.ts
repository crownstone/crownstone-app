type ConnectionState = "INITIALIZING" | "CONNECTING" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED" | "WAITING_FOR_COMMANDS" | "PERFORMING_COMMAND"

type CommandType = "DIRECT" | "MESH" | "BROADCAST"

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
  canActivate:     () => boolean
  willActivate:    () => void
  isDeactivated:   () => void
  isConnected:     () => void
  sessionHasEnded: () => void
}

interface CommandQueueMap {
  direct: {[handle: string]   : BleCommand[]}
  mesh:   {[sphereId: string] : BleCommand[]}
}
interface PromiseContainer<T> {
  promise: Promise<T>,
  resolve: (data?: any) => void,
  reject:  (err:   any) => void
}

interface BleCommand<T = CommandInterface> {
  id:              string,
  linkedId:        string,           // the linkedId refers to mesh_relay commands which can be cancelled if the direct command has succeeded
  command:         T,
  promise:         PromiseContainer,
  attemptingBy:    string[],
  executedBy:      string[],

  // injected the command options here.
  commanderId?:    string,
  sphereId:        string | null,
  commandType?:    CommandType,
  commandTarget:   string,   // this can be a meshId, a handleId or a sphereId
  endTarget?:      string,   // in case that a command can be convayed via the mesh (like a multiswitch) the commandTarget is a meshId
                            // in order to relay the command to a target, the endTarget is a handle of the endTarget of the command.
  private?:        boolean,
  minConnections:  number
  startTime:       number,
  timeout?:        number // seconds
}


interface BroadcastInterface extends CommandInterface {
  canBroadcast: boolean,
  broadcast(command: BleCommand) : Promise<void>
}

interface CommandInterface {
  type: BridgeCommandType,
  canBroadcast: boolean,
  info() : string,
  execute(connectedHandle: string, options?: ExecutionOptions = null) : Promise< any >
  isDuplicate(otherCommand: CommandBase) : boolean
}
interface CommandBaseInterface {
  type: BridgeCommandType,
  canBroadcast: boolean,
  isDuplicate(otherCommand: CommandBase) : boolean
}

interface ExecutionOptions {
  bleCommand: BleCommand,
  queue: CommandQueueMap
}

interface RegisterPayload {
  profileId:number,
  rssiOffset:number,
  ignoreForPresence:boolean,
  tapToToggleEnabled:boolean,
  ttlMinutes:number
}

type PowersampleDataType = "triggeredSwitchcraft" | "missedSwitchcraft" | "filteredBuffer" | "unfilteredBuffer" | "softFuse"