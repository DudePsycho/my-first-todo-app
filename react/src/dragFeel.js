// HOW DRAGGING FEELS, shared by the board and the calendar.
//   pick up: the card lifts (CSS: .lifted grows it a little and tilts it)
//   drop:    the lifted copy glides back into its slot, straightening out as it lands
//            ("settling"), then the card itself gives a small bounce (CSS: .just-dropped)
// People who turn off animations in their system settings get none of this
import { AutoScrollActivator, KeyboardSensor, PointerSensor, TouchSensor, defaultDropAnimationSideEffects, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export function dropAnimation() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;   // no glide: it's simply there
  }
  return {
    duration: 260,
    easing: "cubic-bezier(0.2, 1.2, 0.4, 1)",   // a little past, then back: a soft landing
    keyframes: ({ transform }) => [
      { transform: CSS.Transform.toString(transform.initial) },
      { transform: CSS.Transform.toString(transform.final) }
    ],
    sideEffects: defaultDropAnimationSideEffects({
      className: { dragOverlay: "settling" },   // straightens the tilt while it glides
      styles: { active: { opacity: "0" } }      // the slot stays empty until the card arrives
    })
  };
}

// While dragging, the page (or board) scrolls by itself only when the POINTER is close to
// its edge. (Not the card: a big card near the edge would start scrolling while you aim)
export const AUTO_SCROLL = { activator: AutoScrollActivator.Pointer, threshold: { x: 0.08, y: 0.12 } };

// How a drag starts. Mouse: after moving 5px (so a click still opens the card).
// Touch: after holding a quarter second (so a swipe still scrolls). Keyboard: Space.
// coordinateGetter: how the arrow keys move a card (the board passes the sortable one)
export function useDragSensors(coordinateGetter) {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter, keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } })
  );
}

// How long the landing bounce lasts (the .just-dropped class is taken off after this)
export const BOUNCE_MS = 420;
