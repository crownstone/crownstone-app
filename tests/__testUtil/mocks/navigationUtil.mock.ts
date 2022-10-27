

export function mockNavigationUtil() {
  jest.mock("../../../app/ts/util/navigation/NavigationUtil", () => {
    return jest.fn();
  })
}
