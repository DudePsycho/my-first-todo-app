// THE "+ ADD A TASK" BOX on the board and the calendar: a small card you write a new task in.
// Like the main task box, it understands "tomorrow", "!high", "daily", "at 3pm" and #tags,
// and shows underneath what it understood. Enter adds (and stays open for the next one),
// Escape or Cancel closes it
import { useState } from "react";
import { parseQuickAdd, shortDay } from "./tasks.js";

// What the typed words mean, for the line under the box: "Due Fri 6 Nov · High priority"
function understood(text) {
  const quick = parseQuickAdd(text);
  const found = [];
  if (quick.dueDate) found.push("Due " + shortDay(quick.dueDate));
  if (quick.priority) found.push(quick.priority[0].toUpperCase() + quick.priority.slice(1) + " priority");
  if (quick.repeat) found.push("Repeats " + quick.repeat);
  if (quick.remindAt) found.push("Remind at " + quick.remindAt);
  return found.join(" · ");
}

// label: what a screen reader hears. onAdd(text) adds it; onClose() closes the box
export default function TaskComposer({ label, onAdd, onClose }) {
  const [text, setText] = useState("");
  const meaning = understood(text);

  function add() {
    if (text.trim() === "") {
      return;
    }
    onAdd(text);
    setText("");   // stays open, ready for the next one
  }

  return (
    <div className="composer" onClick={(event) => event.stopPropagation()}>
      <textarea
        className="composer-text"
        aria-label={label}
        placeholder="What needs doing?"
        rows="2"
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();   // keys here are for typing, not for the calendar or board
          if (event.key === "Enter") {
            event.preventDefault();   // a task is one line: Enter adds it
            add();
          }
          if (event.key === "Escape") {
            onClose();
          }
        }}
      />
      <p className="composer-hint" aria-live="polite">
        {meaning || "Try: tomorrow, !high, daily, at 3pm, #project"}
      </p>
      <div className="composer-buttons">
        {/* onMouseDown + preventDefault: the text box keeps the focus while you press */}
        <button type="button" className="composer-cancel" onMouseDown={(event) => event.preventDefault()} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="composer-add" disabled={text.trim() === ""} onMouseDown={(event) => event.preventDefault()} onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
