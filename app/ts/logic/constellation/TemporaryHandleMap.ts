/**
 * This class is used to give a session a temporary sphereId as reference if it cannot find itself in the Mapprovider.stoneHandleMap
 */
class TemporaryHandleMapClass {

  data = {}

  load(handle, sphereId) {
    this.data[handle] = sphereId;
  }

  get(handle) {
    if (this.data[handle]) {
      let sphereId = this.data[handle];
      delete this.data[handle];
      return sphereId;
    }
    return null;
  }
}

export const TemporaryHandleMap = new TemporaryHandleMapClass()