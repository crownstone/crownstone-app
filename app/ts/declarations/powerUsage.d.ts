type itemId = string;
type GRAPH_TYPE = "LIVE" | "DAY" | "WEEK" | "MONTH" | "YEAR"

interface EnergyData {
  startTime: timestamp,
  colorMap: Record<itemId, string>,
  data: Record<itemId, number>[]
}
