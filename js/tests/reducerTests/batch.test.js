var test = require('tape');
let deepFreeze = require('deep-freeze');

import reducer from '../../router/store/reducer'

// hack to remove the current time from the reducer so we can predictably match the results.
Date.prototype.valueOf = function () {return 1};

test('Batch testing', function (t) {
  t.end();
});
