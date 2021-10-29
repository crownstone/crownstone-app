export function mockAppUtil(overrides = {}) {
  jest.mock("../../../app/ts/util/AppUtil", () => {
    return {

    };
  })
}