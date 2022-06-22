import { useEffect, useState } from "react";
import { StoneUtil } from "../../../util/StoneUtil";

export function useTimeout(callback, ms) {
  useEffect(() => { let timeout = setTimeout(callback , ms);
    return () => { clearTimeout(timeout); }
  }, []);
}

export function useInterval(callback, ms, dependencies = []) {
  useEffect(() => {
    let interval = setInterval(callback , ms);

    return () => { clearInterval(interval); }
  }, dependencies);
}

export function useCleanup(callback) {
  useEffect(() => { return callback; }, []);
}

