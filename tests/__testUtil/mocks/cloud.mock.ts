

export function mockCloud() {
  jest.mock("../../../app/ts/cloud/cloudAPI", () => {

    let targetCloud = {
      setAccessToken: jest.fn(),
      setUserId: jest.fn(),
      forUser: jest.fn(),
      forDevice: jest.fn(),
      forInstallation: jest.fn(),
      forStone: jest.fn(),
      forSphere: jest.fn(),
      forScene: jest.fn(),
      forSortedList: jest.fn(),
      forLocation: jest.fn(),
      forMessage: jest.fn(),
      forToon: jest.fn(),
      forHub: jest.fn(),
    }

    let handler = {
      get: function(target, thisArg, argumentsList) {
        // console.log("CLOUD called", thisArg)
        if (targetCloud[thisArg]) {
          return () => { return proxy; };
        }

        return () => { return new Promise((resolve, reject) => { resolve("Test") })};
      }
    }
    let proxy = new Proxy({ }, handler);
    return {CLOUD:proxy};
  })
}
