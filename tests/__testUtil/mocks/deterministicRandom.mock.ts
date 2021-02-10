import { xUtil } from "../../../app/ts/util/StandAloneUtil";

const originalXUtil = xUtil;


let RANDOM_COUNT = 2000;
let DATABASE_LIST = {};
let GLOBAL_TIME = 0;
export function resetMockRandom() {
  RANDOM_COUNT = 2000;
}
export function mockRandom() {
  jest.mock("../../../app/ts/util/StandAloneUtil", () => {
    return { xUtil: {
      ...originalXUtil,
        getHubHexToken : () : string => {
          let str = '';
          for (let i = 0; i < 64; i++) {
            str += (RANDOM_COUNT++)%256
          }
          return str;
        },

        getRandomByte: () : string => {
          let byteValue = (RANDOM_COUNT++)%256;
          let str = byteValue.toString(16);
          if (byteValue < 16) {
            return '0'+str;
          }
          return str
        },

        getToken : () : string => {
          return (RANDOM_COUNT++).toString(36);
        },

        getUUID : () : string => {
          return "uuid" +RANDOM_COUNT++ + '-' + RANDOM_COUNT++;
        },

        getShortUUID : () : string => {
          return "uuid" +RANDOM_COUNT++;
        },
      }}
  })
}