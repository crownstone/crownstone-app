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

export let WEEK_DAY_INDICES = ['Mon','Tue','Wed','Thu','Fri']; // these are keys
export let WEEKEND_DAY_INDICES = ['Sat','Sun']; // these are keys


export let DAY_LABEL_MAP = {
  Mon: Languages.get("__UNIVERSAL", 'DAY_Monday')(),
  Tue: Languages.get("__UNIVERSAL", 'DAY_Tuesday')(),
  Wed: Languages.get("__UNIVERSAL", 'DAY_Wednesday')(),
  Thu: Languages.get("__UNIVERSAL", 'DAY_Thursday')(),
  Fri: Languages.get("__UNIVERSAL", 'DAY_Friday')(),
  Sat: Languages.get("__UNIVERSAL", 'DAY_Saturday')(),
  Sun: Languages.get("__UNIVERSAL", 'DAY_Sunday')(),
};
export let DAYS_LABEL_MAP = {
  Mon: Languages.get("__UNIVERSAL", 'DAY_Mondays')(),
  Tue: Languages.get("__UNIVERSAL", 'DAY_Tuesdays')(),
  Wed: Languages.get("__UNIVERSAL", 'DAY_Wednesdays')(),
  Thu: Languages.get("__UNIVERSAL", 'DAY_Thursdays')(),
  Fri: Languages.get("__UNIVERSAL", 'DAY_Fridays')(),
  Sat: Languages.get("__UNIVERSAL", 'DAY_Saturdays')(),
  Sun: Languages.get("__UNIVERSAL", 'DAY_Sundays')(),
};
export let DAY_SHORT_LABEL_MAP = {
  Mon: Languages.get("__UNIVERSAL", 'DAY_Mon')(),
  Tue: Languages.get("__UNIVERSAL", 'DAY_Tue')(),
  Wed: Languages.get("__UNIVERSAL", 'DAY_Wed')(),
  Thu: Languages.get("__UNIVERSAL", 'DAY_Thu')(),
  Fri: Languages.get("__UNIVERSAL", 'DAY_Fri')(),
  Sat: Languages.get("__UNIVERSAL", 'DAY_Sat')(),
  Sun: Languages.get("__UNIVERSAL", 'DAY_Sun')(),
};

