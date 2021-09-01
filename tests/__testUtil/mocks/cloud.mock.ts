

export function mockCloud() {
  jest.mock("../../../app/ts/cloud/cloudAPI", () => {
    return jest.fn();
  })
}
