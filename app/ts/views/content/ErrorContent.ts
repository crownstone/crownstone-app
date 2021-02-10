import { Languages } from "../../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ErrorContent", key)(a,b,c,d,e);
}
export const ErrorContent = {
  
  getTextDescription: function(phase, errors, dimmingAllowed) {
    if (phase === 1) {
      // PHASE 1 This is only when detected. The user has to find the Crownstone to actually disable it.
      if (errors.temperatureDimmer) {// adapt
        if (dimmingAllowed) {
          return lang("Oh_no__The_Crownstone_tri");
        }
        else {
          return lang("Oh_no__The_Crownstone_tri_noDimming");
        }
      }
      else if (errors.dimmerOnFailure) {// adapt
        if (dimmingAllowed) {
          return lang("Oh_no__I_have_detected_a_");
        }
        else {
          return lang("Oh_no__I_have_detected_a__noDimming");
        }
      }
      else if (errors.dimmerOffFailure) {// adapt
        if (dimmingAllowed) {
          return lang("Oh_no__I_have_detected_a_p");
        }
        else {
          return lang("Oh_no__I_have_detected_a_p_noDimming");
        }
      }
      else if (errors.temperatureChip) {
        return lang("Oh_no__The_Crownstone_got");
      }
      else if (errors.overCurrentDimmer) {
        return lang("Just_in_time__I_detected_");
      }
      else if (errors.overCurrent) {
        return lang("Just_in_time__I_detected_t");
      }
      else {
        return lang("This_Crownstone_needs_to_");
      }
    }
    else {
      // PHASE 2. this allows the user to reset it.
      if (errors.temperatureDimmer) { // adapt
        if (dimmingAllowed) {
          return lang("This_Crownstone_became_to");
        }
        else {
          return lang("This_Crownstone_became_to_noDimming");
        }
      }
      else if (errors.dimmerOnFailure) {// adapt
        if (dimmingAllowed) {
          return lang("I_detected_a_problem_with");
        }
        else {
          return lang("I_detected_a_problem_with_noDimming");
        }
      }
      else if (errors.dimmerOffFailure) { // adapt
        if (dimmingAllowed) {
          return lang("I_detected_a_problem_with_");
        }
        else {
          return lang("I_detected_a_problem_with__noDimming");
        }
      }
      else if (errors.temperatureChip) {
        return lang("The_Crownstone_got_way_to");
      }
      else if (errors.overCurrentDimmer) {
        return lang("I_detected_that_the_devic");
      }
      else if (errors.overCurrent) {
        return lang("I_detected_that_the_conne");
      }
      else {
        return lang("This_Crownstone_needs_to_b");
      }
    }
  },

  getHeader: function(errors, dimmingAllowed) {
    if (errors.temperatureDimmer) {// adapt
      if (dimmingAllowed) {
        return lang("This_Crownstone_became_too");
      }
      else {
        return lang("This_Crownstone_became_too_noDimming");
      }
    }
    else if (errors.dimmerOnFailure) {// adapt
      if (dimmingAllowed) {
        return lang("I_detected_a_problem_with_t");
      }
      else {
        return lang("I_detected_a_problem_with_t_noDimming");
      }
    }
    else if (errors.dimmerOffFailure) {// adapt
      if (dimmingAllowed) {
        return lang("I_detected_a_problem_with_th");
      }
      else {
        return lang("I_detected_a_problem_with_th_noDimming");
      }
    }
    else if (errors.temperatureChip) {
      return lang("The_Crownstone_got_way_too");
    }
    else if (errors.overCurrentDimmer) {
      return lang("I_detected_that_the_device");
    }
    else if (errors.overCurrent) {
      return lang("I_detected_that_the_connec");
    }
    else {
      return lang("This_Crownstone_needs_to_be");
    }
  },

  getSubheader: function(errors, dimmingAllowed) {
    if (errors.temperatureDimmer) {// adapt
      return lang("You_can_reset_this_error_", getAT(),getCompany(),getRock());
    }
    else if (errors.dimmerOnFailure) {// adapt
      return lang("I_turned_on_the_relay_to_", getAT(), getCompany(), getRock());
    }
    else if (errors.dimmerOffFailure) {// adapt
      return lang("I_turned_on_the_relay_to_p", getAT(), getCompany(), getRock());
    }
    else if (errors.temperatureChip) {
      return lang("If_you_reset_the_error__y");
    }
    else if (errors.overCurrentDimmer) {
      return  lang("Reset_the_error_to_restor");
    }
    else if (errors.overCurrent) {
      return lang("Reset_the_error_to_restore");
    }
    else {
      return lang("If_this_happens_more_ofte", getAT(),getCompany(),getRock());
    }
  },

  getButtonLabel: function(errors, dimmingAllowed) {
    if (errors.temperatureDimmer) {
      return lang("Ill_keep_an_eye_on_it_");
    }
    else if (errors.dimmerOnFailure) {
      return lang("Understood_");
    }
    else if (errors.dimmerOffFailure) {
      return lang("Understood_");
    }
    else if (errors.temperatureChip) {
      return lang("Ill_keep_an_eye_on_it_");
    }
    else if (errors.overCurrentDimmer) {
      return lang("I_wont_do_it_again_");
    }
    else if (errors.overCurrent) {
      return lang("Ill_keep_an_eye_on_it_");
    }
    else {
      return lang("Restart_Crownstone_");
    }
  }
  
};

function getAT()      { return "@";          }
function getCompany() { return "crownstone"; }
function getRock()    { return "rocks";      }