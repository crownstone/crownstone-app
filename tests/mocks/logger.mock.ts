


class MockLogger {
  levelPrefix: string;
  enabled: boolean;
  silenceMap: any;
  constructor(levelPrefix = '?', enabled = true, silenceMap = {}) {
    this.levelPrefix = levelPrefix;
    this.enabled = enabled;
    this.silenceMap = silenceMap;
  }

  info(...any) {
    if (this.silenceMap['info'] === undefined) {
      this._log('------------', arguments);
    }
  }

  promiseManager(...any) {
    if (this.silenceMap['promiseManager'] === undefined) {
      this._log('PROMISE MNGR', arguments);
    }
  }

  broadcast(...any) {
    if (this.silenceMap['broadcast'] === undefined) {
      this._log('BROADCAST --', arguments);
    }
  }

  notifications(...any) {
    if (this.silenceMap['notifications'] === undefined) {
      this._log('NOTIFCATION ', arguments);
    }
  }

  event(...any) {
    if (this.silenceMap['event'] === undefined) {
      this._log('EVENT ------', arguments);
    }
  }

  cloud(...any) {
    if (this.silenceMap['cloud'] === undefined) {
      this._log('Cloud ------', arguments);
    }
  }

  advertisements(...any) {
    if (this.silenceMap['advertisements'] === undefined) {
      this._log('ADVERTISEMENTS --------', arguments);
    }
  }

  bch(...any) {
    if (this.silenceMap['bch'] === undefined) {
      this._log('bch --------', arguments);
    }
  }

  ble(...any) {
    if (this.silenceMap['ble'] === undefined) {
      this._log('BLE --------', arguments);
    }
  }

  store(...any) {
    if (this.silenceMap['store'] === undefined) {
      this._log('Store ------', arguments);
    }
  }

  dfu(...any) {
    if (this.silenceMap['dfu'] === undefined) {
      this._log('DFU --------', arguments);
    }
  }

  behaviour(...any) {
    if (this.silenceMap['behaviour'] === undefined) {
      this._log('Behaviour --', arguments);
    }
  }

  scheduler(...any) {
    if (this.silenceMap['scheduler'] === undefined) {
      this._log('Scheduler --', arguments);
    }
  }

  mesh(...any) {
    if (this.silenceMap['mesh'] === undefined) {
      this._log('Mesh -------', arguments);
    }
  }

  messages(...any) {
    if (this.silenceMap['messages'] === undefined) {
      this._log('Messages ---', arguments);
    }
  }

  native(...any) {
    if (this.silenceMap['native'] === undefined) {
      this._log('Native -----', arguments);
    }
  }

  nav(...any) {
    if (this.silenceMap['nav'] === undefined) {
      this._log('NAV --------',  arguments);
    }
  }

  _log(type, allArguments) {
    if (!this.enabled) { return }
    let args = ['LOG' + this.levelPrefix + ' ' + type + ' :'];
    for (let i = 0; i < allArguments.length; i++) {
      let arg = allArguments[i];
      args.push(arg);
    }

    // @ts-ignore
    console.log.apply(this, args);
  }
}

export function mockLogger(enabledMap = {}, silenceMap = {}) {
  jest.mock("../../js/logging/Log", () => {
    return {
      LOGv: new MockLogger('v', enabledMap['v'] === 1, silenceMap),
      LOGd: new MockLogger('d', enabledMap['d'] === 1, silenceMap),
      LOGi: new MockLogger('i', enabledMap['i'] === 1, silenceMap),
      LOG : new MockLogger('i', enabledMap['i'] === 1, silenceMap),
      LOGw: new MockLogger('w', enabledMap['w'] === 1, silenceMap),
      LOGe: new MockLogger('e', enabledMap['e'] === 1, silenceMap),
    }
  })
}

export function silence() {
  return {
    info: true,
    promiseManager: true,
    broadcast: true,
    notifications: true,
    event: true,
    cloud: true,
    advertisements: true,
    bch: true,
    ble: true,
    store: true,
    dfu: true,
    behaviour: true,
    scheduler: true,
    mesh: true,
    messages: true,
    native: true,
    nav: true,
  }
}


export function silenceCommon() {
  return {
    // info: true,
    // promiseManager: true,
    // broadcast: true,
    // notifications: true,
    event: true,
    // cloud: true,
    // advertisements: true,
    // bch: true,
    // ble: true,
    // store: true,
    // dfu: true,
    // behaviour: true,
    // scheduler: true,
    // mesh: true,
    // messages: true,
    // native: true,
    // nav: true,
  }
}