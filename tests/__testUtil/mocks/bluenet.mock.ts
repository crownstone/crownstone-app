
export function mockBluenet() {
  let bluenetMock = {
    broadcastExecute: jest.fn(),
    reset: null
  };
  jest.mock("../../../app/ts/native/libInterface/Bluenet", () => {
    return {
      Bluenet: bluenetMock
    }
  });

  bluenetMock.reset = () => {
    bluenetMock.broadcastExecute.mockReset()
  }
  return bluenetMock;
}