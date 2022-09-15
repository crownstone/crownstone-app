import {formatResultsErrors} from "jest-message-util";

const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

let cfg;

class FastFailure {

  test_done(event) {
    let test = event.test;
    if (test.errors.length > 0) {
      console.warn("A test has encountered an Error. The rest of the tests will be aborted.");
      console.info(formatResultsErrors([
        {
          ancestorTitles:[test.parent.name],
          fullName:test.name,
          failureDetails:test.errors[0][0],
          failureMessages:[String(test.errors[0][0].stack)],
          duration: test.duration,
          numPassingAsserts:0,
          status: "failed",
          title: test.name,
        }
      ], cfg as any,{noStackTrace:false}));
      process.exit();
    }
  }
}

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    cfg = config;
    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
      FastFailure
    });
  }
}

module.exports = CustomDetoxEnvironment;

