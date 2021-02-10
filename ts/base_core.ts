export const base_core : base_core = {
  store: {getState: () => { return {}}},
  sessionMemory: {
    loginEmail: null,
    cameraSide: 'front',
    cacheBusterUniqueElement: Math.random(),
    developmentEnvironment: false,
  },
};