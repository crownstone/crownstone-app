export class CommandBase {

  handle: string;
  type:   BridgeCommandType;

  constructor(handle: string, type: BridgeCommandType) {
    this.handle = handle;
    this.type   = type;
  }

  isDuplicate(otherCommand: CommandBase) : boolean {
    if (this.type == otherCommand.type && this.handle === otherCommand.handle) {
      return this.duplicateCheck(otherCommand);
    }
    return false;
  }

  duplicateCheck(otherCommand: CommandBase) : boolean {
    return true;
  }
}