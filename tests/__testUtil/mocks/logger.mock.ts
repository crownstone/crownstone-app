class MockLogger {
  levelPrefix: string;
  enabled: boolean;
  silenceMap: any;
  constructor(levelPrefix = '?', enabled = true, silenceMap: any = silence()) {
    this.levelPrefix = levelPrefix;
    this.enabled = enabled;
    this.silenceMap = silenceMap;
  }

  info(...any) {
    if (this.silenceMap['info'] !== true) {
      this._log('------------', arguments);
    }
  }

  constellation(...any) {
    if (this.silenceMap['constellation'] !== true) {
      this._log('CONSTELLATION', arguments);
    }
  }

  promiseManager(...any) {
    if (this.silenceMap['promiseManager'] !== true) {
      this._log('PROMISE MNGR', arguments);
    }
  }

  broadcast(...any) {
    if (this.silenceMap['broadcast'] !== true) {
      this._log('BROADCAST --', arguments);
    }
  }

  notifications(...any) {
    if (this.silenceMap['notifications'] !== true) {
      this._log('NOTIFCATION ', arguments);
    }
  }

  event(...any) {
    if (this.silenceMap['event'] !== true) {
      this._log('EVENT ------', arguments);
    }
  }

  cloud(...any) {
    if (this.silenceMap['cloud'] !== true) {
      this._log('Cloud ------', arguments);
    }
  }

  advertisements(...any) {
    if (this.silenceMap['advertisements'] !== true) {
      this._log('ADVERTISEMENTS --------', arguments);
    }
  }

  bch(...any) {
    if (this.silenceMap['bch'] !== true) {
      this._log('bch --------', arguments);
    }
  }

  ble(...any) {
    if (this.silenceMap['ble'] !== true) {
      this._log('BLE --------', arguments);
    }
  }

  store(...any) {
    if (this.silenceMap['store'] !== true) {
      this._log('Store ------', arguments);
    }
  }

  dfu(...any) {
    if (this.silenceMap['dfu'] !== true) {
      this._log('DFU --------', arguments);
    }
  }

  behaviour(...any) {
    if (this.silenceMap['behaviour'] !== true) {
      this._log('Behaviour --', arguments);
    }
  }

  scheduler(...any) {
    if (this.silenceMap['scheduler'] !== true) {
      this._log('Scheduler --', arguments);
    }
  }

  mesh(...any) {
    if (this.silenceMap['mesh'] !== true) {
      this._log('Mesh -------', arguments);
    }
  }

  messages(...any) {
    if (this.silenceMap['messages'] !== true) {
      this._log('Messages ---', arguments);
    }
  }

  native(...any) {
    if (this.silenceMap['native'] !== true) {
      this._log('Native -----', arguments);
    }
  }

  nav(...any) {
    if (this.silenceMap['nav'] !== true) {
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
  jest.mock("../../../app/ts/logging/Log", () => {
    return {
      LOGv: new MockLogger('v', enabledMap['v'] === true, silenceMap),
      LOGd: new MockLogger('d', enabledMap['d'] === true, silenceMap),
      LOGi: new MockLogger('i', enabledMap['i'] === true, silenceMap),
      LOG : new MockLogger('i', enabledMap['i'] === true, silenceMap),
      LOGw: new MockLogger('w', enabledMap['w'] === true, silenceMap),
      LOGe: new MockLogger('e', enabledMap['e'] === true, silenceMap),
    }
  })
}

export function silence() {
  return {
    info: true,
    broadcast: true,
    constellation: true,
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