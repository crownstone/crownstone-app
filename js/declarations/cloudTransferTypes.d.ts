
type transferToCloudData = {
  localId?: string,
  localData?: any,
  sphereId: string,
  cloudId?: string,
  extraFields? : any,
}

type transferToLocalData = {
  localId?: string,
  sphereId: string,
  cloudId?: string,
  cloudData?: any,
  extraFields? : any,
}

type transferScheduleToLocalData = {
  localId: string,
  sphereId: string,
  stoneId: string,
  cloudId?: string,
  cloudData?: any,
}


type transferScheduleToCloudData = {
  localId: string,
  localData: any,
  sphereId: string,
  stoneId: string,
  cloudId?: string,
}


type fieldMap = [{
  local: string,
  cloud: string,
  cloudToLocalOnly? : boolean,
  localFields?: string[],
  cloudFields? : string[],
}]