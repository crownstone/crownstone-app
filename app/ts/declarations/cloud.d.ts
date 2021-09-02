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
