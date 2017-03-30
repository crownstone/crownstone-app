const test = require('tape');
var SunCalc = require('suncalc');

test('dawn', function (t) {
  // position:
  let lat = 51.923611570463152;
  let lon = 4.4667693378575288;
  // get today's sunlight times for London
  var times = SunCalc.getTimes(new Date(), lat, lon);

  let keys = Object.keys(times);
  keys.forEach((key) => {
    console.log(key, times[key].valueOf(), new Date(times[key]))
  })
  t.end();
});


