type SupportedMappingType = 'location'        |
                            'scene'           |
                            'sphereUser'      |
                            'hub'             |
                            'stone'           |
                            'behaviour'       |
                            'ability'         |
                            'abilityProperty'

type SyncInterfaceOptions = {
  cloudId: string,
  cloudSphereId: string,
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
  transferPromises: Promise<any>[]
}