type itemId = string;
type GRAPH_DATE_TYPE =  "DAY" | "WEEK" | "MONTH" | "YEAR"
type GRAPH_TYPE = "LIVE" | GRAPH_DATE_TYPE

interface EnergyData {
  startTime: timestamp,
  colorMap: Record<itemId, string>,
  data: Record<itemId, number>[]
}

interface StoneBucketEnergyData {
  buckets:     Record<stoneId, number[]>,
  bucketCount: number
};
