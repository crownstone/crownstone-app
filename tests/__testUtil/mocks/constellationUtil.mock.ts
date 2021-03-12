import { ConstellationUtil } from "../../../app/ts/logic/constellation/util/ConstellationUtil";

const originalConstellationUtil = ConstellationUtil;

export function mockConstellationUtil() {
  let constellationState = { allowBroadcasting: true, reset: null };

  jest.mock("../../../app/ts/logic/constellation/util/ConstellationUtil", () => {
    return { ConstellationUtil: {
        ...originalConstellationUtil,
        canBroadcast: () => { return constellationState.allowBroadcasting; }
      }}
  })

  constellationState.reset = () => { constellationState.allowBroadcasting = true; };
  return constellationState;
}