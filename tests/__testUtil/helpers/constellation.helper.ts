import { xUtil } from "../../../app/ts/util/StandAloneUtil";

export function getCommandOptions(sphereId:string, targets : string[], privateSession: boolean = false) : commandOptions {
  let options : commandOptions = {
    commanderId:    xUtil.getShortUUID(),
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: targets,
    private:        privateSession,
    minConnections: 3,
    timeout:        60,
  };
  return options;
}

export function getCommandOptionsMesh(sphereId:string, targets : string[], privateSession: boolean = false) : commandOptions {
  let options : commandOptions = {
    commanderId:    xUtil.getShortUUID(),
    sphereId:       sphereId,
    commandType:    "MESH",
    commandTargets: targets,
    private:        privateSession,
    minConnections: 3,
    timeout:        60,
  };
  return options;
}