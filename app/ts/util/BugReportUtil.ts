import Bugsnag from "@bugsnag/react-native";
import { USE_ERROR_REPORTING } from "../ExternalConfig";

export const BugReportUtil = {

  breadcrumb: (message, data, meta) => {
    if (USE_ERROR_REPORTING) {
      Bugsnag.leaveBreadcrumb(message, data, meta);
    }
  }
}