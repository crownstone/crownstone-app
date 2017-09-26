
type transferData = {
  localId?: string,
  localData?: any,
  sphereId: string,
  stoneId?: string,
  cloudId?: string,
  cloudData?: any,
  extraFields? : any,
}

type fieldMap = [{
  local: string,
  cloud: string,
  localFields?: string[],
  cloudFields? : string[],
}]