type SupportedMappingType = 'ability'         |
                            'abilityProperty' |
                            'behaviour'       |
                            'hub'             |
                            'location'        |
                            'scene'           |
                            'sphereUser'      |
                            'stone'           |
                            'toon'

type SyncInterfaceOptions = {
  cloudId: string,
  cloudSphereId: string,
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
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