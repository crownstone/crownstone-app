
export const ErrorContent = {
  
  getTextDescription: function(phase,errors) {
    if (phase === 1) {
      // PHASE 1
      if (errors.temperatureDimmer) {
        return "Oh no! The Crownstone tried to dim your device for you, but there was so much power required that the Crownstone overheated! I had to switch it off to protect you and your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.temperatureChip) {
        return "Oh no! The Crownstone got way too warm! I had to switch it off to protect you and your devices.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.overCurrentDimmer) {
        return "Just in time! I detected that the device that you tried to dim uses more current than is safe (100 W). I had to disable it.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else if (errors.overCurrent) {
        return "Just in time! I detected that the connected device uses more current than is safe (16 A). I had to disable it.\n\nFind and tap on the Crownstone to resolve this error.";
      }
      else {
        return "This Crownstone needs to be restarted.\n\nFind and tap on the Crownstone to continue.";
      }
    }
    else {
      // PHASE 2
      if (errors.temperatureDimmer) {
        return "This Crownstone became too warm because it used so much power during dimming!\n\nIf you reset the error, you will be able to try to dim again, but be sure that the power demand is not too much for the Crownstone (>100 watts).";
      }
      else if (errors.temperatureChip) {
        return "The Crownstone got way too warm! I had to switch it off to protect you and your devices.\n\nIf you reset the error, you will be able to use it again, but check if your devices do not use too much power.";
      }
      else if (errors.overCurrentDimmer) {
        return "I detected that the device that you tried to dim uses more current than is safe (100 W). I had to disable it.\n\nIf you reset the error, you will be able to use it again.";
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