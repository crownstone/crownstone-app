const test = require('tape');
let deepFreeze = require('deep-freeze');
var SunCalc = require('suncalc');

test('dawn', function (t) {
  // position:
  let lat = 51.923611570463152;
  let lon = 4.4667693378575288;
  // get today's sunlight times for London
  var times = SunCalc.getTimes(new Date(), lat, lon);

  t.end();
});


