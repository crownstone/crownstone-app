const test = require('tape');
var SunCalc = require('suncalc');

test('dawn', function (t) {
  // position:
  let lat = 51.923611570463152;
  let lon = 4.4667693378575288;
  lat = 37.387032
  lon = -122.114267
  // get today's sunlight times for Rotterdam
  var times = SunCalc.getTimes(new Date('2020-12-29'), lat, lon);

  console.log(times);

  // let keys = Object.keys(times);
  // keys.forEach((key) => {
  //   console.log(key, times[key].valueOf(), new Date(times[key]))
  // });
  t.end();
});


