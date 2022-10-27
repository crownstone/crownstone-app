
interface views {
  [key: string]: componentInfo[]
}
interface activeView {
  [key: string]: string
}

interface componentInfo {
  id: string,
  name: string,
}
