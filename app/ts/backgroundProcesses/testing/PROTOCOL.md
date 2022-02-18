# Protocol for mocking bridge file

The Bridge calls and Nativebus events can be mocked by enabling Bluenet Promise Mocks and setting a Bridge mock url
via the TestConfiguration view. This is automatically done in the UI testing.

## place BluenetPromise calls

Send a POST request to http://<localIP>:3100/callPromise with body:

```json
{
  "id":       string,
  "function": string,
  "args":     any[]
}
```

## resolving BluenetPromise calls

You resolve the promises with SSE events in the following format:

```json
{
    "type":   "failCall",
    "callId": string,
    "error":  string   
}
```
or
```json
{
    "type":   "succeedCall",
    "callId": string,
    "data":   any   
}
```

These events will be triggered by calling the following endpoints:

POST: http://<localIP>:3100/fail with body
```json
{
  "handle":   string | null,
  "function": string,
  "error":    string
}
```
POST: http://<localIP>:3100/succeed with body
```json
{
  "handle":   string | null,
  "function": string,
  "data":     any
}
```


## Injecting NativeBus events

You inject them via SSE in the following format:
```json
{
    "type":  "event",
    "topic": string,
    "data":  any   
}
```
This event will be triggered by calling the following endpoint:

POST: http://<localIP>:3100/event with body
```json
{
  "topic": string,
  "data":  any
}
```

# Checking calls made

GET: http://<localIP>:3100/calls which returns

```json
{
  "pending":  callFormat[],
  "finished": callFormat[]
}

interface callFormat {
  "id":       string,
  "function": string,
  "args":     any[],
  "tStart":   number,
  "tEnd":     number | null,
}
```
