import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_TransferHubTokenAndCloudId extends CommandBase implements CommandBaseInterface {

  hubToken: string;
  cloudId:  string;
  constructor(handle: string, hubToken: string, cloudId: string) {
    super(handle, "transferHubTokenAndCloudId");
    this.hubToken = hubToken;
    this.cloudId  = cloudId;
  }


  async execute(options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.transferHubTokenAndCloudId(this.handle, this.hubToken, this.cloudId);
  }
  
}

