# User

type:
- USER_LOG_IN
```js 
data: {
    name: String,
    tokens: Array of Objects
    picture: String / Boolean
}
```
- USER_LOG_UPDATE
```js 
data: {
    name: String,
    tokens: Array of Objects
    picture: String / Boolean
}
```
- USER_LOG_OUT


# Groups

required:
- groupId : String

type:
- ADD_GROUP
```js 
data: {name: String, latitude: Number, longitude: Number}
```
- UPDATE_GROUP
```js 
data: {name: String, latitude: Number, longitude: Number}
```
- REMOVE_GROUP

# Presets

None yet.

# Locations

required:
- groupId : String
- locationId : String

type:
- ADD_LOCATION
```js 
data: {name: String, icon: String}
```
- .
```js 
data: {name: String, icon: String}
```
- REMOVE_LOCATION

- ADD_LOCATION_PICTURE
```js 
data: {fullURI: String, barURI: String, squareURI: String}
```
- REMOVE_LOCATION_PICTURE


# Stones

required:
- groupId : String
- locationId : String
- stoneId: String

type:
- ADD_STONE
```js 
data: {name: String, icon: String, dimmable: String}
```
- UPDATE_STONE_CONFIG
```js 
data: {name: String, icon: String, dimmable: String}
```
- REMOVE_STONE

- UPDATE_STONE_STATE
```js 
data: {state: Number, currentUsage: Number}
```

- UPDATE_BEHAVIOUR_CONFIG
```js 
data: {onlyOnAfterDusk: Boolean, onlyOnAtDusk: Boolean}
```
- UPDATE_BEHAVIOUR_ON_HOME_ENTER
```js 
data: {state: Number, timeout: Number, fadeTime: Number}
```
- UPDATE_BEHAVIOUR_ON_HOME_EXIT
```js 
data: {state: Number, timeout: Number, fadeTime: Number}
```
- UPDATE_BEHAVIOUR_ON_ROOM_ENTER
```js 
data: {state: Number, timeout: Number, fadeTime: Number}
```
- UPDATE_BEHAVIOUR_ON_ROOM_EXIT
```js 
data: {state: Number, timeout: Number, fadeTime: Number}
```
- ADD_LINKED_DEVICE
Yet to be built.
- UPDATE_LINKED_DEVICE
Yet to be built.
- REMOVE_LINKED_DEVICE
Yet to be built.

- ADD_STONE_SCHEDULE
Yet to be built.
- UPDATE_STONE_SCHEDULE
Yet to be built.
- REMOVE_STONE_SCHEDULE
Yet to be built.




# Settings

# App