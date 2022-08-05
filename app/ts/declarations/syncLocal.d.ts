type SupportedMappingType = 'ability'         |
                            'abilityProperty' |
                            'behaviour'       |
                            'fingerprint'     |
                            'hub'             |
                            'location'        |
                            'scene'           |
                            'sphereUser'      |
                            'stone'           |
                            'toon'

type SyncInterfaceOptions = {
  cloudId:          string,
  cloudSphereId:    string,
  globalCloudIdMap: syncIdMap
  sphereIdMap:      syncIdMap,
  actions:          DatabaseAction[],
  transferPromises: Promise<any>[]
}

type SyncInterfaceBaseOptions = {
  cloudId: string,
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
  transferPromises: Promise<any>[]
}
type SyncInterfaceViewOptions = {
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
  transferPromises: Promise<any>[]
}

interface GatherOptions {
  key:        string,
  cloudKey?:  string,
  onlyIds?:   string[],
  type:       SupportedMappingType,
  children?:  GatherOptions[]
  cloudIdGetter?:   (item: any) => string,
  updatedAtGetter?: (item: any) => string,
}