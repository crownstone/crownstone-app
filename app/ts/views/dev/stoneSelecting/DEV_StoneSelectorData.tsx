
class StoneSelectorDataContainerClass {
  data : any = {
    verified: {},
    unverified: {},
    setup: {},
    dfu: {},
  };

  started = false;
}

export const StoneSelectorDataContainer = new StoneSelectorDataContainerClass();