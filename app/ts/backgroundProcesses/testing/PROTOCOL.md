# Protocol for mocking bridge file

The Bridge calls and Nativebus events can be mocked by enabling Bluenet Promise Mocks and setting a Bridge mock url
via the TestConfiguration view. This is automatically done in the UI testing.

# Bluenet calls

Send a POST request to http://<localIP>:3100/callBluenet with body:

```json
{
  "function": string,
  "args":     any[]
}
```

## Actally using the bridge

If it is required to have the app call the actual bridge function, you can do this with the following event:

For promises:
For direct bluenet calls:
```json
{
    "type":   "callBluenet",
    "functionName": string,
    "arguments": any[]
}
```

# BluenetPromise calls

Send a POST request to http://<localIP>:3100/callPromise with body:

```json
{
  "id":       string,
  "function": string,
  "args":     any[]
}
```

## Resolving BluenetPromise calls

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
  "error":    string,
  "timeout":  number
}
```
POST: http://<localIP>:3100/succeed with body
```json
{
  "handle":   string | null,
  "function": string,
  "data":     any,
  "timeout":  number
}
```

The timeout is in seconds and is used to give a window of X seconds for the call to come in.
Both endpoints will return either "SUCCESS" or "CALL_DOES_NOT_EXIST" and will wait for either the timeout or the resolution.

## Actally using the bridge

If it is required to have the app call the actual bridge function, you can do this with the following event:

For promises:
```json
{
    "type":   "nativeResolve",
    "callId": string
}
```


# Injecting NativeBus events

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

# Mocking Notifications

You inject them via SSE in the following format:
```json
{
    "type":  "notification",
    "data":  any   
}
```
This event will be triggered by calling the following endpoint:

POST: http://<localIP>:3100/notification with body
```json
{
  "data":  any
}
```


# Checking calls made

GET: http://<localIP>:3100/calls which returns

```json
{
  "pending":  callFormat[],
  "finished": callFormat[],
  "bluenet":  bluenetCallFormat[]
}

interface callFormat {
  "id":       string,
  "function": string,
  "args":     any[],
  "tStart":   number,
  "tEnd":     number | null,
}

interface bluenetCallFormat {
  "function":     string,
  "args":         any[],
  "tStart":       number,
  "performType"?: "native" | "auto"
}
```
