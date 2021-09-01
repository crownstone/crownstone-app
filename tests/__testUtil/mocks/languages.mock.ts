

export function mockLanguages() {
  jest.mock("../../../app/ts/Languages", () => {
    return jest.fn();
  })
}
