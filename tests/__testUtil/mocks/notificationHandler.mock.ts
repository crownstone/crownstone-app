export function mockNotificationHandler(overrides = {}) {
  jest.mock("../../../app/ts/backgroundProcesses/NotificationHandler", () => {
    return {
      NotificationHandler: {
        request: jest.fn()
      }
    };
  })
}