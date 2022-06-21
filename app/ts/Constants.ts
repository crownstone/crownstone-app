import { Languages } from "./Languages";

export const DAY_INDICES_SUNDAY_START = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
]
export const DAY_INDICES_MONDAY_START = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
]
export const MONTH_INDICES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export let WEEK_DAY_INDICES = ['Mon','Tue','Wed','Thu','Fri']; // these are keys
export let WEEKEND_DAY_INDICES = ['Sat','Sun']; // these are keys


export let DAY_LABEL_MAP = function(key) {
  switch (key) {
    case "Mon":
      return Languages.get("__UNIVERSAL", 'DAY_Monday')();
    case "Tue":
      return Languages.get("__UNIVERSAL", 'DAY_Tuesday')();
    case "Wed":
      return Languages.get("__UNIVERSAL", 'DAY_Wednesday')();
    case "Thu":
      return Languages.get("__UNIVERSAL", 'DAY_Thursday')();
    case "Fri":
      return Languages.get("__UNIVERSAL", 'DAY_Friday')();
    case "Sat":
      return Languages.get("__UNIVERSAL", 'DAY_Saturday')();
    case "Sun":
      return Languages.get("__UNIVERSAL", 'DAY_Sunday')();
  }
};

export let DAYS_LABEL_MAP = function(key) {
  switch (key) {
    case "Mon":
      return Languages.get("__UNIVERSAL", 'DAY_Mondays')();
    case "Tue":
      return Languages.get("__UNIVERSAL", 'DAY_Tuesdays')();
    case "Wed":
      return Languages.get("__UNIVERSAL", 'DAY_Wednesdays')();
    case "Thu":
      return Languages.get("__UNIVERSAL", 'DAY_Thursdays')();
    case "Fri":
      return Languages.get("__UNIVERSAL", 'DAY_Fridays')();
    case "Sat":
      return Languages.get("__UNIVERSAL", 'DAY_Saturdays')();
    case "Sun":
      return Languages.get("__UNIVERSAL", 'DAY_Sundays')();
  }
};

export let DAY_SHORT_LABEL_MAP = function(key) {
  switch (key) {
    case "Mon":
      return Languages.get("__UNIVERSAL", 'DAY_Mon')();
    case "Tue":
      return Languages.get("__UNIVERSAL", 'DAY_Tue')();
    case "Wed":
      return Languages.get("__UNIVERSAL", 'DAY_Wed')();
    case "Thu":
      return Languages.get("__UNIVERSAL", 'DAY_Thu')();
    case "Fri":
      return Languages.get("__UNIVERSAL", 'DAY_Fri')();
    case "Sat":
      return Languages.get("__UNIVERSAL", 'DAY_Sat')();
    case "Sun":
      return Languages.get("__UNIVERSAL", 'DAY_Sun')();
  }
};



export let MONTH_LABEL_MAP = function(key) {
  switch (key) {
    case "Jan":
        return Languages.get("__UNIVERSAL", 'MONTH_January')();
    case "Feb":
      return Languages.get("__UNIVERSAL", 'MONTH_February')();
    case "Mar":
      return Languages.get("__UNIVERSAL", 'MONTH_March')();
    case "Apr":
      return Languages.get("__UNIVERSAL", 'MONTH_April')();
    case "May":
      return Languages.get("__UNIVERSAL", 'MONTH_May_full')();
    case "Jun":
      return Languages.get("__UNIVERSAL", 'MONTH_June')();
    case "Jul":
      return Languages.get("__UNIVERSAL", 'MONTH_July')();
    case "Aug":
      return Languages.get("__UNIVERSAL", 'MONTH_August')();
    case "Sep":
      return Languages.get("__UNIVERSAL", 'MONTH_September')();
    case "Oct":
      return Languages.get("__UNIVERSAL", 'MONTH_October')();
    case "Nov":
      return Languages.get("__UNIVERSAL", 'MONTH_November')();
    case "Dec":
      return Languages.get("__UNIVERSAL", 'MONTH_December')();
  }
};



export let MONTH_SHORT_LABEL_MAP = function(key) {
  switch (key) {
    case "Jan":
      return Languages.get("__UNIVERSAL", 'MONTH_Jan')();
    case "Feb":
      return Languages.get("__UNIVERSAL", 'MONTH_Feb')();
    case "Mar":
      return Languages.get("__UNIVERSAL", 'MONTH_Mar')();
    case "Apr":
      return Languages.get("__UNIVERSAL", 'MONTH_Apr')();
    case "May":
      return Languages.get("__UNIVERSAL", 'MONTH_May')();
    case "Jun":
      return Languages.get("__UNIVERSAL", 'MONTH_Jun')();
    case "Jul":
      return Languages.get("__UNIVERSAL", 'MONTH_Jul')();
    case "Aug":
      return Languages.get("__UNIVERSAL", 'MONTH_Aug')();
    case "Sep":
      return Languages.get("__UNIVERSAL", 'MONTH_Sep')();
    case "Oct":
      return Languages.get("__UNIVERSAL", 'MONTH_Oct')();
    case "Nov":
      return Languages.get("__UNIVERSAL", 'MONTH_Nov')();
    case "Dec":
      return Languages.get("__UNIVERSAL", 'MONTH_Dec')();
  }
};

