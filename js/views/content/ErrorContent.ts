
export const ErrorContent = {
  
  getTextDescription: function(phase,errors) {
    console.log("GETTING ERR DESC", phase, errors)

    if (phase === 1) {
      // PHASE 1 This is only when detected. The user has to find the Crownstone to actually disable it.
      if (errors.temperatureDimmer) {
        return "Oh no! The Crownstone tried to dim your device for you, but there was so much power required that the Crownstone overheated! I turned on the relay to protect your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.dimmerOnFailure) {
        return "Oh no! I have detected a problem with the dimmer funtionality. I turned on the relay to protect your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.dimmerOffFailure) {
        return "Oh no! I have detected a problem with the dimmer funtionality. I turned on the relay to protect your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.temperatureChip) {
        return "Oh no! The Crownstone got way too warm! I had to switch it off to protect you and your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.overCurrentDimmer) {
        return "Just in time! I detected that the device that you tried to dim uses more power than is safe (100 W). I turned on the relay to protect your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.overCurrent) {
        return "Just in time! I detected that the connected device uses more current than is safe (16 A). I had to turn it off.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else {
        return "This Crownstone needs to be restarted.\n\nFind and tap on the Crownstone to continue.";
      }
    }
    else {
      // PHASE 2. this allows the user to reset it.
      if (errors.temperatureDimmer) {
        return "This Crownstone became too warm because it used so much power during dimming!\n\nYou can reset this error to restore functionality. If this happens more often, contact us at http://www.crownstone.rocks resolve this.";
      }
      else if (errors.dimmerOnFailure) {
        return "I detected a problem with the dimmer functionality. I turned on the relay to protect your devices.\n\nYou can reset this error to restore functionality. If this happens more often, contact us at http://www.crownstone.rocks resolve this.";
      }
      else if (errors.dimmerOffFailure) {
        return "I detected a problem with the dimmer functionality. I turned on the relay to protect your devices.\n\nYou can reset this error to restore functionality. If this happens more often, contact us at http://www.crownstone.rocks resolve this.";
      }
      else if (errors.temperatureChip) {
        return "The Crownstone got way too warm! I had to switch it off to protect you and your devices.\n\nIf you reset the error, you will be able to use it again, but check if your devices do not use too much power.";
      }
      else if (errors.overCurrentDimmer) {
        return "I detected that the device that you tried to dim uses more power than is safe (100 W). I had to disable it.\n\nIf you reset the error, you will be able to use it again.";
      }
      else if (errors.overCurrent) {
        return "I detected that the connected device uses more current than is safe (16 A). I had to disable it.\n\nIf you reset the error, you will be able to use it again.";
      }
      else {
        return "This Crownstone needs to be restarted. You can reset the state again to remove this notification.";
      }
    }
  }
  
}