import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("UserLayer", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  View
} from 'react-native';
import {getPresentUsersInLocation} from "../../util/DataUtil";
import {UserPicture} from "../components/animated/UserPicture";
import {TextCircle} from "../components/animated/TextCircle";
import { core } from "../../core";


export class UserLayer extends LiveComponent<any, any> {
  unsubscribeStoreEvents;
  users: any;
  maxUsersShownOnRoom : number;
  appUserSize : number;
  otherUserSize : number;

  constructor(props) {
    super(props);
    this.maxUsersShownOnRoom = props.maxUsersShownOnRoom || 4;
    this.appUserSize         = props.appUserSize         || 50;
    this.otherUserSize       = props.otherUserSize       || 40;
  }

  _getPositionOffset(x , y, currentUserIndex, totalUsersInRoom, isAppUser) {
    if (currentUserIndex > this.maxUsersShownOnRoom || currentUserIndex > totalUsersInRoom) {
      return;
    }

    let roomRadius = this.props.nodeRadius;
    let userDiameter = this.otherUserSize;
    let userRadius = 0.5 * userDiameter;
    let centerX = x + roomRadius - userRadius;
    let centerY = y + roomRadius - userRadius;

    let basePositions = {
      appUser: {x: x - 0.25*userDiameter, y: y - 0.25*userDiameter},
      '1': [
        {x: roomRadius * Math.cos(1.75*Math.PI), y: roomRadius * Math.sin(1.75*Math.PI)},
      ],
      '2': [
        {x: roomRadius * Math.cos(1.25*Math.PI), y: roomRadius * Math.sin(1.25*Math.PI)},
        {x: roomRadius * Math.cos(1.75*Math.PI), y: roomRadius * Math.sin(1.75*Math.PI)},
      ],
      '3': [
        {x: roomRadius * Math.cos(1.25*Math.PI), y: roomRadius * Math.sin(1.25*Math.PI)},
        {x: roomRadius * Math.cos(1.50*Math.PI), y: roomRadius * Math.sin(1.50*Math.PI)},
        {x: roomRadius * Math.cos(1.75*Math.PI), y: roomRadius * Math.sin(1.75*Math.PI)},
      ],
      '4': [
        {x: roomRadius * Math.cos(1.25*Math.PI) , y: roomRadius * Math.sin(1.25*Math.PI) },
        {x: roomRadius * Math.cos(1.425*Math.PI), y: roomRadius * Math.sin(1.425*Math.PI)},
        {x: roomRadius * Math.cos(1.61*Math.PI) , y: roomRadius * Math.sin(1.61*Math.PI) },
        {x: roomRadius * Math.cos(1.77*Math.PI),  y: roomRadius * Math.sin(1.77*Math.PI)},
      ],
      extra: [
        {x: roomRadius * Math.cos(1.25*Math.PI) , y: roomRadius * Math.sin(1.25*Math.PI) },
        {x: roomRadius * Math.cos(1.425*Math.PI), y: roomRadius * Math.sin(1.425*Math.PI)},
        {x: roomRadius * Math.cos(1.61*Math.PI) , y: roomRadius * Math.sin(1.61*Math.PI) },
        {x: roomRadius * Math.cos(1.77*Math.PI),  y: roomRadius * Math.sin(1.77*Math.PI)},
      ]
    };

    if (isAppUser) {
      return basePositions['appUser'];
    }
    else {
      if (totalUsersInRoom > this.maxUsersShownOnRoom) {
        let pos = basePositions['extra'][currentUserIndex-1];
        return {x: centerX + pos.x, y: centerY - pos.y};
      }
      else {
        let pos = basePositions[totalUsersInRoom][currentUserIndex-1];
        return {x: centerX + pos.x, y: centerY - pos.y};
      }
    }
  }


  componentDidMount() {
    const store = core.store;

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      const state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      let change = data.change;
      if (
        change.changeUsers       ||
        change.changeUserData    ||
        change.changeSphereUsers ||
        change.updateSphereUser  ||
        (change.userPositionUpdate && change.userPositionUpdate.sphereIds[this.props.sphereId])
      ) {
        this.forceUpdate();
      }
    });

  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const locationIds = Object.keys(sphere.locations);

    let users = {};
    let userArray = [];

    // for each location, get the users in there.
    locationIds.forEach((locationId) => {
      let node = this.props.nodes[locationId];
      if (!node) {
        console.warn("UserLayer: Can not find node:", locationId, this.props.nodes);
        return;
      }


      let presentUsers = getPresentUsersInLocation(state, this.props.sphereId, locationId);
      //
      // presentUsers = [
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      //   {id:Math.floor(Math.random()*1e5), data: {accessLevel: "admin",email: "bart@dobots.nl",firstName: "bart",invitationPending: false,lastName: "dobots",picture: "file:///var/mobile/Containers/Data/Application/B62EB16C-F33D-4C99-8D31-F130C4F7C039/Documents/585aa3befe73d7130042801b.jpg",pictureId: "5b76e8ba518f81001d14d27e",present: false,updatedAt: 1574248629885}},
      // ]
      if (presentUsers.length > 0) {
        let currentOtherUserIndex = 0;
        let userIsInRoom = false;

        presentUsers.forEach((user) => {
          if (user.id === state.user.userId) {
            userIsInRoom = true;
          }
        });

        let totalOtherUsersInRoom = presentUsers.length;
        if (userIsInRoom) {
          totalOtherUsersInRoom -= 1;
        }

        presentUsers.forEach((user) => {
          let isAppUser = user.id === state.user.userId;
          if (!isAppUser) {
            currentOtherUserIndex += 1;
          }

          let positionOnRoom = this._getPositionOffset(node.x, node.y, currentOtherUserIndex, totalOtherUsersInRoom, isAppUser);

          if (isAppUser) {
            let key = 'userLocationPicture' + user.id;
            users[key] = <UserPicture key={key} x={positionOnRoom.x} y={positionOnRoom.y} opacity={1} user={user} size={this.appUserSize}/>;
          }
          else {
            if (currentOtherUserIndex < this.maxUsersShownOnRoom && totalOtherUsersInRoom > this.maxUsersShownOnRoom || totalOtherUsersInRoom <= this.maxUsersShownOnRoom) {
              let key = 'userLocationPicture' + user.id;
              users[key] = <UserPicture key={key} x={positionOnRoom.x} y={positionOnRoom.y} opacity={1} user={user} size={user.id === state.user.userId ? this.appUserSize : this.otherUserSize}/>
            }
            else if (currentOtherUserIndex === this.maxUsersShownOnRoom && totalOtherUsersInRoom > this.maxUsersShownOnRoom) {
              let key = 'userLocationExtra' + locationId + (totalOtherUsersInRoom - this.maxUsersShownOnRoom + 1);
              users[key] = <TextCircle key={key} text={"+" + (totalOtherUsersInRoom - this.maxUsersShownOnRoom + 1)} size={0.8 * this.otherUserSize} x={positionOnRoom.x} y={positionOnRoom.y} opacity={1} />
            }
          }
        });
      }
    });

    let userIds = Object.keys(users);
    userIds.forEach((userId) => {
      userArray.push(users[userId]);
    });

    return (
      <View style={{
        width: this.props.width,
        height: this.props.height,
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'transparent'
      }}>
        {userArray}
      </View>
    )
  }
}
