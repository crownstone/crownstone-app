type SupportedMappingType = 'hub'

type SyncInterfaceOptions = {
  cloudId: string,
  cloudSphereId: string,
  globalCloudIdMap: globalCloudIdMap
  actions: any[],
  transferPromises: Promise<any>[]
}