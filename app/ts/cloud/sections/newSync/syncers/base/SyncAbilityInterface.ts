import { LOGe } from "../../../../../logging/Log";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";
import { LocationTransferNext } from "../../transferrers/LocationTransferNext";
import { ToonTransferNext } from "../../transferrers/ToonTransferNext";



export class SyncAbilityInterface<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  cloudSphereId:    string;
  localSphereId:    string;

  cloudStoneId : string;
  localStoneId : string;

  cloudAbilityId : string;
  localAbilityId : string;

  transferrer : TransferAbilityTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>;

  constructor(
    transferrer:    TransferAbilityTool<LocalDataFormat, LocalDataSettableFormat, CloudDataFormat, CloudSettableFormat>,
    options:        SyncInterfaceOptions,
    cloudStoneId:   string,
    cloudAbilityId: string,
  ) {
    super(options);
    this.transferrer    = transferrer;
    this.cloudAbilityId = cloudAbilityId;
    this.cloudStoneId   = cloudStoneId;
    this.cloudSphereId  = options.cloudSphereId;
    this.localSphereId  = this.globalCloudIdMap.spheres[this.cloudSphereId]    || MapProvider.cloud2localMap.spheres[this.cloudSphereId];
    this.localStoneId   = this.globalCloudIdMap.stones[this.cloudStoneId]      || MapProvider.cloud2localMap.stones[this.cloudStoneId];
    this.localAbilityId = this.globalCloudIdMap.abilities[this.cloudAbilityId] || MapProvider.cloud2localMap.abilities[this.cloudAbilityId];
  }

  process(response: SyncResponseItemCore<CloudDataFormat>, reply: SyncRequestSphereData) {
    super.process(response, reply);
  }
}