

export function mockInviteCenter() {
  jest.mock("../../../../app/ts/backgroundProcesses/InviteCenter", () => {
    return jest.fn();
  })
}
