import { useEffect, useState } from "react";
import { StoneUtil } from "../../../util/StoneUtil";

export function useTimeout(callback, ms) {
  useEffect(() => { let timeout = setTimeout(callback , ms);
    return () => { clearTimeout(timeout); }
  }, []);
}

export function useCleanup(callback) {
  useEffect(() => { return callback; }, []);
}
