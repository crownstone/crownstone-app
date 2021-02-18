export function mockExternalConfig() {
  jest.mock("../../../app/ts/ExternalConfig", () => {
    return {
      DISABLE_TIMEOUT: 20
    };
  })
}