type Rssi        = number;
type Timestamp   = number;
type DeviceUUID  = string; // <ibeaconUUID>_Maj:<ibeaconMajor>_Min:<ibeaconMinor> like D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:47254_Min:57646
type LocationId  = string;
type DevicesData = Record<DeviceUUID, Rssi>

// Fingerprint
interface FingerprintDatapoint {
  devices: DevicesData,
  timestamp: Timestamp
}
interface AppFingerprintFormat {
  spheres: {
    [sphereId: string]: {  // sphereCloudId
      sphere: SphereData,
      fingerprints: {
        [locationId: LocationId]: {
          name: string,       // location name
          cloudId: string,    // location cloudId
          fingerprint: FingerprintDatapoint[]
        }
      }
    }
  }
}

// Datasets
interface AppDatasetFormat {
  sphereCloudId: string,
  sphere: SphereData,
  annotation: string,
  device: {
    name: string,
    deviceType: string,
    model: string,
  },
  location: {
    name: string,
    uid: LocationId,
  },
  dataset: FingerprintDatapoint[]
}

// config
interface ScenarioConfig {
  activeScenario: string,
}

