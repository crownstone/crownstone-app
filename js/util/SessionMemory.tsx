
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SessionMemory", key)(a,b,c,d,e);
}
export let SessionMemory = {
  loginEmail: null,
  cameraSide: 'front',
  cacheBusterUniqueElement: Math.random()
};