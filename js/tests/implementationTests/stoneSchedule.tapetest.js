const test = require('tape');

test('dawn', function (t) {
  let time = new Date('2017-01-01 18:30:23');

  let currentDayOfWeek = new Date().getDay(); // 0 .. 6 with sunday = 0
  let now = Date.now();

  let hoursSet = new Date(time).getHours();
  let minutesSet = new Date(time).getMinutes();

  let timeToday = new Date(new Date().setHours(hoursSet)).setMinutes(minutesSet);

  let daysSorted = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let activeDays = {
    Mon: false,
    Tue: false,
    Wed: true,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false,
  };

  for (let i = currentDayOfWeek; i < daysSorted.length + currentDayOfWeek + 1; i++) {
    if (activeDays[daysSorted[i%daysSorted.length]] === true) {
      let timeAtDay = timeToday + (i - currentDayOfWeek) * 24*3600*1000;
      if (timeAtDay > now) {
        console.log(timeAtDay, new Date(timeAtDay));
        break;
      }
    }
  }
  t.end();
});


