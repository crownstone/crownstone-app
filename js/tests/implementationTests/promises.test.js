var test = require('tape');
let deepFreeze = require('deep-freeze');

let successfulPromise5 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(5)}, 100);
});
let successfulPromise10 = new Promise((resolve, reject) => {
  setTimeout(() => {resolve(10)}, 100);
});
let failedPromise5 = new Promise((resolve, reject) => {
  setTimeout(() => {reject(5)}, 100);
});
let failedPromise10 = new Promise((resolve, reject) => {
  setTimeout(() => {reject(10)}, 100);
});

test('Promise I', function (t) {
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

test('Promise II', function (t) {
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

test('Promise III', function (t) {
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

test('Promise III', function (t) {
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


