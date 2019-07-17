# bluenet-ios-shared

[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)

This houses the protocols, datatypes and Logger that are shared among modules of the iOS lib.

This module is made to work with Carthage. 

With carthage installed, add this to your cartfile:

```
# bluenet-ios-shared 
github "crownstone/bluenet-ios-shared"
```

and run

```
carthage update --platform iOS
```

Follow the Carthage instructions to add the framework to your project.

### Logging

For convenience, we provide a logger that allows you to log to file or screen with multiple log levels. You can create a global variable or an instance for specific uses.

The levels are:
```swift 

public enum LogLevel : Int {
    case VERBOSE = 0
    case DEBUG
    case INFO
    case WARN
    case ERROR
    case NONE
}

```

Usage:

```swift

let LOG = LogClass()

LOG.verbose("lowest Level:0")
LOG.debug("level:1")
LOG.info("level:2")
LOG.warn("level:3")
LOG.error("level:4")

// this will log to file regardless of the fileLevel set and will never log to screen.
LOG.file("special method to only log to file.")

```

You can choose what you want to log to screen and what you want to log to file by using the following methods:

```swift

LOG.setPrintLevel(level: LogLevel) // default .INFO
LOG.setFileLevel(level: LogLevel)  // default .NONE 

```

The logger uses a base filename per LogClass. By default this is 'BluenetLog'. You can change it like this:

```swift

let LOG = LogClass(logBaseFilename: String)

// or

// will remove all logs with the previous base filename before setting the new one
LOG.setBaseFilename(logBaseFilename: String)


```


The logger keeps track of logs per day. You can define how many days it should keep logs:

```swift

let LOG = LogClass(daysToStoreLogs: Int)

// or

LOG.setDaysToStoreLogs(daysToStoreLogs: Int)

```

You can manually clean the logs or clear the logs. Cleaning means all log files that are older than the amount of days will be deleted. Clearing can delete all log files (configurable). 

The Logger performs a clean on:
- init
- change of amount of days (setDaysToStoreLogs)
- after changing the base filename. (setBaseFilename)
- manually (cleanLogs)

Clearing is done on:
- changing the base filename  (setBaseFilename)
- manually. 

The following methods are available:

```swift

// clear all log files
open func clearLogs() {}

// remove logfiles older than configured amount of days
open func cleanLogs() {}

// custom clear method. If keepAmountOfDays = 0, all will be removed, 
//   if it is 3, the logs of the last 3 days will be kept.
open func clearLogs(keepAmountOfDays: Int) {}

```

Finally, you can initialize the logger using the following init methods:


```swift

/** 
 * using init() 
 *   daysToStoreLogs = 3
 *   baseFilename = "BluenetLog"
 */
let LOG = LogClass()


/** 
 * using init(daysToStoreLogs: Int)
 *   baseFilename = "BluenetLog"
 */
let LOG = LogClass(daysToStoreLogs: Int)


/** 
* using init(logBaseFilename: String) 
*   daysToStoreLogs = 3
*/
let LOG = LogClass(logBaseFilename: String)


/** 
 * using init(daysToStoreLogs:Int, logBaseFilename: String)
 */
let LOG = LogClass(daysToStoreLogs:Int, logBaseFilename: String)


```
