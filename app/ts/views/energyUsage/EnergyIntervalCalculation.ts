let MINUTES_MS = 60*1000;
let HOUR_MS    = 60*MINUTES_MS;
let DAY_MS     = 24*HOUR_MS;
let WEEK_MS    = 7*DAY_MS;
let MONTH_MS   = 28*DAY_MS;

export const EnergyIntervalCalculation = {
  hours: {
    isOnSamplePoint:        function(timestamp: number) : boolean {
      let date = new Date(timestamp);
      let samplePoint = date.setMinutes(date.getMinutes() - (date.getMinutes() % 60),0,0);
      return samplePoint === timestamp;
    },
    getPreviousSamplePoint: function(timestamp: number) : number  {
      let date = new Date(timestamp);
      let samplePoint = date.setMinutes(date.getMinutes() - (date.getMinutes() % 60),0,0);
      return samplePoint;
    },
    getNthSamplePoint(fromSamplePoint: number, n: number) : number {
      return fromSamplePoint + n*MINUTES_MS*60;
    },
    getNumberOfSamplePointsBetween(fromSamplePoint: number, toSamplePoint: number) : number {
      return Math.floor((toSamplePoint - fromSamplePoint) / (MINUTES_MS*60));
    }
  },

  days: {
    isOnSamplePoint: function(timestamp: number) : boolean {
      let date = new Date(timestamp);
      let samplePoint = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      return samplePoint === timestamp;
    },
    getPreviousSamplePoint: function(timestamp: number) : number  {
      let date = new Date(timestamp);
      let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      return midnight;
    },
    getNthSamplePoint(fromSamplePoint: number, n: number) : number {
      let date = new Date(fromSamplePoint);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n).getTime();
    },
    getNumberOfSamplePointsBetween(fromSamplePoint: number, toSamplePoint: number) : number {
      return Math.floor((toSamplePoint - fromSamplePoint) / DAY_MS);
    }
  },

  weeks: {
    isOnSamplePoint: function(timestamp: number) : boolean {
      let date = new Date(timestamp);
      let day = (date.getDay() + 6) % 7; // 0 = monday, 6 = sunday
      let monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day).getTime();
      return monday === timestamp;
    },
    getPreviousSamplePoint: function(timestamp: number) : number  {
      // go to the monday at midnight of the week of the timestamp
      let date = new Date(timestamp);
      let day = (date.getDay() + 6) % 7; // 0 = monday, 6 = sunday
      let monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day).getTime();
      return monday;
    },
    getNthSamplePoint(fromSamplePoint: number, n: number) : number {
      let date = new Date(fromSamplePoint);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7*n).getTime();
    },
    getNumberOfSamplePointsBetween(fromSamplePoint: number, toSamplePoint: number) : number {
      let weeks = Math.floor((fromSamplePoint - toSamplePoint) / WEEK_MS);
      return weeks;
    }
  },

  months: {
    isOnSamplePoint: function(timestamp: number) : boolean {
      let date = new Date(timestamp);
      let samplePoint = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      return timestamp === samplePoint;
    },
    getPreviousSamplePoint: function(timestamp: number) : number  {
      // get the first of the previous month of the timestamp
      let date = new Date(timestamp);
      let firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      return firstOfMonth;
    },
    getNthSamplePoint(fromSamplePoint: number, n: number) : number {
      let date = new Date(fromSamplePoint);
      let firstOfMonth = new Date(date.getFullYear(), date.getMonth()+n, 1).getTime();
      return firstOfMonth;
    },
    getNumberOfSamplePointsBetween(fromSamplePoint: number, toSamplePoint: number) : number {
      let dateFrom = new Date(fromSamplePoint);
      let dateTo   = new Date(toSamplePoint);
      let yearsDifference = (dateTo.getFullYear() - dateFrom.getFullYear());
      let monthsDifference = (dateTo.getMonth() - dateFrom.getMonth());
      return yearsDifference*12 + monthsDifference;
    }
  }
}

