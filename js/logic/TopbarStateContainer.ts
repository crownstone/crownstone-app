

class TopbarStateContainerClass {
  views = {};

  constructor() { }

  addProxy(id, props) {
    this.views[id] = props;
  }

  getProxy(id) {
    return this.views[id]
  }

  updateProxy(id, props) {
    this.views[id] = props;
  }

  removeProxy(id) {
    delete this.views[id];
  }

}

export const TopbarStateContainer = new TopbarStateContainerClass();
