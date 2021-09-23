type SupportedMappingType = 'location' | 'scene' | 'sphereUser' | 'hub' | 'stone' | 'behaviour' | 'ability'

type SyncInterfaceOptions = {
  cloudId: string,
  cloudSphereId: string,
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
  transferPromises: Promise<any>[]
}