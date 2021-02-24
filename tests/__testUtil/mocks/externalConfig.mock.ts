export function mockExternalConfig(overrides = {}) {
  jest.mock("../../../app/ts/ExternalConfig", () => {
    return {
      DISABLE_TIMEOUT: overrides['DISABLE_TIMEOUT'] || 20
    };
  })
}