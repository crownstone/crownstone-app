

export class CommandBase {

  handle: string;
  type:   BridgeCommandType;

  constructor(handle: string, type: BridgeCommandType) {
    this.handle = handle;
    this.type   = type;
  }

  isDuplicate(otherCommand: CommandBase) {
    if (this.type == otherCommand.type) {
      return true;
    }
    return false;
  }
}