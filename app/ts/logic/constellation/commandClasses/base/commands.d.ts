interface CommandBaseInterface {
  handle: string,
  type: BridgeCommandType,

  execute(options?: ExecutionOptions = null) : Promise< any >

}

interface ExecutionOptions {
  bleCommand: BleCommand,
  queue: CommandQueueMap
}

type BridgeCommandType = "toggle" | "multiSwitch" | "turnOn"