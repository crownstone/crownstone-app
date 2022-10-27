interface HeaderObject {
  'Accept'?: string,
  'Content-Type': string,
  'Cache-control'?: string
  'Authorization'?:  string,
}

interface CloudResponse<T> {
  status: number,
  data: T
}

type HTTPmethod = "POST" | "GET" | "DELETE" | "PUT"
interface RequestOptions {
  id?: string,
  query?: {[paramName: string] : any},
  body?:  {[paramName: string] : any}
}


interface EnergyMeasurementData {
  stoneId: string, t: timeISOString, energy: number
}
interface EnergyReturnData {
  stoneId: string, timestamp: timeISOString, energyUsage: number
}
type timeISOString = string;
type EnergyUsageRange = 'day' | 'week' | 'month' | 'year';

type StoreReply = {
  message: string,
  count: number,
}
