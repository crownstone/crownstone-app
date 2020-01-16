import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";
import { DataUtil } from "../../util/DataUtil";
import { core } from "../../core";
import { AicoreTwilight } from "../../views/deviceViews/smartBehaviour/supportCode/AicoreTwilight";
import { AicoreBehaviour } from "../../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
import { BEHAVIOUR_TYPES } from "../../router/store/reducers/stoneSubReducers/rules";

export function migrate() {
  let actions = [];
  DataUtil.callOnAllStones(core.store.getState(),  (sphereId: string, stoneId: string, stone: any) => {
    let rules = stone.rules;
    let ruleIds = Object.keys(rules);

    ruleIds.forEach((ruleId) => {
      let ruleData = rules[ruleId];
      let rule : AicoreTwilight | AicoreBehaviour = null;
      if (ruleData.type === BEHAVIOUR_TYPES.twilight) { rule = new AicoreTwilight(ruleData.data);  }
      else                                            { rule = new AicoreBehaviour(ruleData.data); }

      if (rule.getDimAmount() < 1) {
        rule.setDimPercentage(Math.floor(rule.getDimAmount() * 100));
        actions.push({type:"U PDATE_STONE_RULE", sphereId: sphereId, stoneId: stoneId, ruleId: ruleId, data: {data: rule.stringify() }})
      }
    });
  })
  if (actions.length > 0) {
    core.store.batchDispatch(actions);
  }

  upTo3_0();
}

export function migrateBeforeInitialization() : Promise<void> {
  return clean_upTo4_0();
}