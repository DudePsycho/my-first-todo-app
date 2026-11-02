// A HOOK that answers "is this a phone-sized screen?", and redraws when the answer changes
// (a phone turned sideways, a window made narrow). The board and calendar use it to switch
// to their simpler phone layouts
import { useEffect, useState } from "react";

const PHONE_SCREEN = "(max-width: 760px)";

export function usePhone() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE_SCREEN).matches);
  useEffect(function () {
    const screen = window.matchMedia(PHONE_SCREEN);
    const changed = () => setIsPhone(screen.matches);
    screen.addEventListener("change", changed);
    return () => screen.removeEventListener("change", changed);
  }, []);
  return isPhone;
}
