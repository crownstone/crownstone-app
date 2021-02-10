export const TestUtil = {
  nextTick: async () => {
    return new Promise<void>((resolve,reject) => {
      setImmediate(() => { resolve(); })
    })
  },

  wait: async (delayMs: number = 50) => {
    return new Promise<void>((resolve,reject) => {
      setTimeout(() => { resolve(); }, delayMs)
    })
  }
}
