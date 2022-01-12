export function mockExternalConfig(overrides = {}) {
  jest.mock("../../../app/ts/ExternalConfig", () => {
    return {
      DISABLE_NATIVE: true,
      DISABLE_TIMEOUT: overrides['DISABLE_TIMEOUT'] || 20,
      BROADCAST_THROTTLE_TIME: 100,
      MINIMUM_FIRMWARE_VERSION_BROADCAST: "2.0.0"
    };
  })
}