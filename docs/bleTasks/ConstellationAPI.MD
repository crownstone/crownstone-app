# Sending BLE commands

This document will describe the architecture of the new TellerAPI that is used to send commands to the Crownstones.

Here I will outline the ideas behind the API, as well as discuss the components and their relations. 

### Why would you call it constellation?
Because it needed a name and the previous one, TellerAPI based on the teller methods, didnt sound right.
A constellation is a set of stars connected by imaginary lines. Almost just like a phone connected to many Crownstones!


Let's first introduce the concepts:

## Design Concepts
We differentiate between two usage types:
#### Private connections
Private connections are used to send a number of commands to a Crownstone in for instance, a setup process. A private connection
will give the requestor full command over the connection. This means that no pending commands by other parties in the app will 
be sent over this connection untill the private connection is released.
Private connections auto-terminate in 60 seconds to catch a missing release of the connection.
  
#### Shared connections
An Public connection is a connection to a Crownstone which any part of the app can use to send commands. This is close to the original batch command handler implementation.
Any piece of code can just say they want to send something in the mesh, in a sphere, somewhere nearby or to a specific crownstone.

#### Tellers
The interface you use to send a command to a Crownstone via a public connection is:
```
function tell(description: string | StoneData) : CommandAPI 

function tellMesh(meshId, minConnections = 3) : CommandAPI 

function tellNearby(minConnections = 3) : CommandAPI 

function tellLocation(locationId, minConnections = 3) : CommandAPI 

function tellSphere(sphereId, minConnections = 3) : CommandAPI 
```

These can be used like:
```
await tell(crownstoneHandle).turnOn()

// or

await tellSphere(sphereId).trackedDeviceHeartbeat(...)
```

A private connection is requested by:
```
async function connectTo(handle, timoutSeconds = 30) : Promise<CommandAPI>
```
This will resolve when the connection is made and provide you with a connection api. The timeout can be provided to cancel the attempt
to connect to the requested Crownstone after x time.

#### CommandAPI
The CommandAPI basically wraps all commands that you can send to a Crownstone. It contains a Collector (see below) to provide connections. This is the class that you'll
interact with most of all. You can perform multiple commands on the CommandAPI, which are all asynchronous.
The command API can choose to send commands via broadcast if possible using the BroadcastCommandManager.

#### Collector
The collector is a class which collects a number of Crownstone handles from the database to connect to in order for your Teller to deliver it's messages.
There is one Collector per CommandAPI. Since a collector might start connecting to 10 crownstones, it will keep track of when these succeed. If we only really need 
to tell 3 crownstones, it will also close the other 7 pending requests. That's what that minConnections means! To summarize, a Collector will decide which Crownstones
it will request Sessions from via the SessionManager.

#### Sessions
A session is a connection(attempt) with a Crownstone. It signifies that something it trying to connect, or is connected to a Crownstone. The sessions are responsible for 
getting a connection, respecting the timeout, requesting commands to send to the Crownstone when connected and cleanup of the connection.

#### SessionManager
The session manager does bookkeeping of sessions. If multiple Collectors want to have a session with Crownstone 5, the SessionManager will ensure there's only a single session 
and the BleCommandQueue will ensure that all Crownstones can get their messages sent. The SessionManager also has a managementAPI, where we can kill all sessions when we 
want to start a DFU process for instance. It will also be able to queue session requests if it is blocked from making new sessions (like with DFU). This class will also limit 
the total number of open Sessions if required.

#### BleCommandQueue
This collects a queue of commands for a number of Crownstones. Once a Session is connected, it requests something to do from the BleCommandQueue. This queue looks at the
handle of the connected session, the meshId of the mesh that crownstone is in and the sphere it is in. It can then flush all commands that can be delivered to this Crownstone.
It also houses the promises of all the async commandAPI invocations (like ```await tell(crownstoneHandle).turnOn()```).

The BleCommandQueue is the authority on duplicate handling and timing out commands. These timeouts are optional, but default to 60 seconds.

## Discussion

The challenge in this setup is to merge a friendly api which both the public and private connections can use.

The main difference between the private and public Session is that a private session remains in existence until it is ended (or timed out). During it's existence, the private Session can
only request commands which have the same privateId as the session itself. Private Sessions are always with 1 other Crownstone. They don't support mesh, sphere or sets of Sessions.

We will try to keep as little shadow-state as possible and forward most commands to the library. A connection request to a Crownstone that already has a pending connection will fail in the lib.
If you request a connection to something thats already connected, you will succeed in the lib.
