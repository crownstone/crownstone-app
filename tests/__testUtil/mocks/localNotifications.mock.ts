

export function mockLocalNotifications() {
  jest.mock("../../../app/ts/notifications/LocalNotifications", () => {
    return jest.fn();
  })
}
