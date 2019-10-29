import React from "react";
import { Background } from "../../components/Background";
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";

export class DEV_PresenceMocking extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:"Presence Mocking"})
  }

  render() {
    return (
      <Background image={core.background.light}/>
    );
  }
}


