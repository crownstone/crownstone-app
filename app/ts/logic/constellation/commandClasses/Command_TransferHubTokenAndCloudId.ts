import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_TransferHubTokenAndCloudId extends CommandBase implements CommandBaseInterface {

  hubToken: string;
  cloudId:  string;
  constructor(hubToken: string, cloudId: string) {
    super("transferHubTokenAndCloudId");
    this.hubToken = hubToken;
    this.cloudId  = cloudId;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.transferHubTokenAndCloudId(connectedHandle, this.hubToken, this.cloudId);
  }
  
}

