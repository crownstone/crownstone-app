export const TestUtil = {
  nextTick: async (count = 1) => {
    for (let i = 0; i < count; i++) {
      await tick();
    }
  },

  wait: async (delayMs: number = 50) => {
    return new Promise<void>((resolve,reject) => {
      setTimeout(() => { resolve(); }, delayMs)
    })
  }
}


function tick() {
  return new Promise<void>((resolve,reject) => {
    setImmediate(() => { resolve(); })
  })
}