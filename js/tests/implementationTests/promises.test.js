const test = require('tape');
let deepFreeze = require('deep-freeze');
const Promise = require("promise");


let successfulPromise5 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(5)}, 100);
});
let successfulPromise10 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(10)}, 100);
});
let successfulPromise15 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(15)}, 100);
});
let successfulPromise20 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(20)}, 100);
});
let failedPromise5 = new Promise((resolve, reject) => {
  setTimeout(() => {reject(5)}, 100);
});
let failedPromise10 = new Promise((resolve, reject) => {
  setTimeout(() => {reject(10)}, 100);
});

function getPromisechain() {
  return successfulPromise5.then(() => {return successfulPromise10})
    .then(() => {return successfulPromise15})
    .then(() => {return successfulPromise20})
}

function getFailingPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {reject(5)}, 100);
  });
}

function getPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {resolve(5)}, 100);
  });
}


function slow() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {resolve(1)},200)
  })
    .then(() => {
      return new Promise((resolve2, reject2) => {
        setTimeout(() => {resolve2(2)}, 200);
      })
    })
}

test('Promise 1', function (t) {
  successfulPromise5
    .then((res) => {
      t.deepEqual(res, 5, 'return 5' );
      return successfulPromise10;
    })
    .then((res) => {
      t.deepEqual(res, 10, 'return 10' );
      return failedPromise5;
    })
    .catch((err) => {
      t.deepEqual(err, 5, 'ERROR: FIRST 5, now correct error...' );
      return failedPromise10
    })
    .then(() => {
      t.deepEqual(true, false, 'this should not be fired');
    })
    .catch((err) => {
      t.deepEqual(err, 10, 'ERROR: return 5' );
      t.end();
    });
});

test('Promise 2', function (t) {
  failedPromise5
    .then(() => {
      t.deepEqual(true, false, 'this should not be fired');
    })
    .then(() => {
      t.deepEqual(true, false, 'this should not be fired');
    })
    .catch((err) => {
      t.deepEqual(err, 5, 'ERROR: 5' );
      t.end();
    })
});

test('Promise 3', function (t) {
  successfulPromise5
    .then((res) => {
      t.deepEqual(res, 5, 'return 5' );
      return failedPromise5;
    })
    .then(() => {
      t.deepEqual(true, false, 'this should not be fired');
    })
    .catch((err) => {
      t.deepEqual(err, 5, 'ERROR: 5' );
      t.end();
    })
});

test('Promise 4', function (t) {
  successfulPromise5
    .then((res) => {
      t.deepEqual(res, 5, 'return 5' );
      return failedPromise5;
    })
    .catch((err) => {
      t.deepEqual(err, 5, 'ERROR: 5' );
      return false;
    })
    .then((success) => {
      if (success === true) {
        t.deepEqual(true, false, 'this should not be fired');
      }
      t.deepEqual(success, false, 'skipping then');
      t.end();
    })
});


test('Promise 5', function (t) {
  slow()
    .then((res) => {
      t.deepEqual(res, 2, 'waited for "then"' );
      t.end();
    })
});




test('Promise All', function (t) {
  let promises1 = [];
  let promises2 = [];
  let result = 0;
  promises1.push(slow().then((res) => {result = res}));

  Promise.all(promises1.concat(promises2)).then(() => {
    t.deepEqual(result, 2, 'waited for "then"' );
    t.end();
  })
});


test('Promise catch', function (t) {
  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {reject(13)},40);
  });

  promise
    .catch((err) => {
      t.deepEqual(err, 13, 'err 1' );
      throw new Error("Y")
    })
    .catch((err) => {
      t.deepEqual(err.message, 'Y', 'err 2' );
      throw new Error("Z")
    })
    .then(() => {
      t.deepEqual(1, 'Z', 'should not be here' );
    })
    .catch((err) => {
      t.deepEqual(err.message, 'Z', 'err 3' );
      t.end();
    })
});


test('Promise catch', function (t) {
  getPromisechain().then((handle) => {
    t.deepEqual(handle, 20, 'should be at the end of the chain' );
    t.end();
  })
});



test('Promise parts', function (t) {
  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {resolve(5)}, 100);
  });


  setTimeout(() => {
    promise
      .then((res) => {
        t.deepEqual(res, 5, 'return 5' );
        return successfulPromise10;
      })
      .then((res) => {
        t.deepEqual(res, 10, 'return 10' );
        return failedPromise5;
      })
      .catch((err) => {
        t.deepEqual(err, 5, 'ERROR: FIRST 5, now correct error...' );
        return failedPromise10
      })
      .then(() => {
        t.deepEqual(true, false, 'this should not be fired');
      })
      .catch((err) => {
        t.deepEqual(err, 10, 'ERROR: return 5' );
        t.end();
      });
  }, 200)

});


test('Promise skips', function (t) {
    successfulPromise5
      .then((res) => {
        t.deepEqual(res, 5, 'return 5' );
      })
      .then((res) => {
        t.deepEqual(res, undefined, 'return undefined');
      })
      .then((res) => {
        t.deepEqual(res, undefined, 'return undefined' );
        return failedPromise5;
      })
      .catch((err) => {
        t.deepEqual(err, 5, 'ERROR: return 5' );
        t.end();
      });
});

