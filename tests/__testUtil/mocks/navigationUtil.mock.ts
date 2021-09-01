

export function mockNavigationUtil() {
  jest.mock("../../../app/ts/util/NavigationUtil", () => {
    return jest.fn();
  })
}
