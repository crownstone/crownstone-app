import { LOGe } from "../../../../../logging/Log";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { MapProvider } from "../../../../../backgroundProcesses/MapProvider";
import { SyncBaseInterface } from "./SyncBaseInterface";



export class SyncInterface<LocalDataFormat, CloudDataFormat extends {id: string}, CloudSettableFormat>
  extends SyncBaseInterface<LocalDataFormat, CloudDataFormat, CloudSettableFormat> {

  constructor(options: SyncInterfaceBaseOptions) {
    super(options);
  }

}