
type transferToCloudData = {
  localId?: string,
  localData?: any,
  localSphereId: string,
  cloudSphereId: string,
  cloudId: string,
  extraFields? : any,
}

type transferNewToCloudData = {
  localId?: string,
  localData?: any,
  localSphereId: string,
  cloudSphereId: string,
  extraFields? : any,
}


type transferToLocalData = {
  localId: string,
  localSphereId: string,
  cloudId?: string,
  cloudData?: any,
  extraFields? : any,
}


type fieldMap = [{
  local: string,
  cloud: string,
  cloudToLocalOnly? : boolean,
  localToCloudOnly? : boolean,
  permissionNeeded? : boolean,
  localFields?: string[],
  cloudFields? : string[],
}]

interface globalIdMap {
  users: any,
  locations: any,
  appliances: any,
  stones: any,
  messages: any,
  spheres: any,
  schedules: any,
}