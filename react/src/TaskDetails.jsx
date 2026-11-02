// THE TASK POP-UP: opens when you click a card on the board or a task in the calendar.
// Everything about one task, laid out as:
//   the tick box, the task's name (edit it right there) and the Today star
//   a grid of details: list, priority, due date, repeat, reminder
//   notes (with formatting), then steps
//   Delete on the left, Mark as done on the right
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import NotesEditor from "./NotesEditor.jsx";
import { StepList } from "./TaskItem.jsx";
import { LIST_NAMES, REPEAT_NAMES, todayString } from "./tasks.js";

// task: the task to show. onUpdate(changes) changes it, onToggle(event) ticks it,
// onDelete() deletes it, onAllSteps(count) is for the dog, onClose() closes the pop-up
export default function TaskDetails({ task, onUpdate, onToggle, onDelete, onAllSteps, onClose }) {
  const dialog = useRef(null);
  const [name, setName] = useState(task.text);   // the name box, saved when you leave it

  // Once the pop-up is on the page, open it as a modal (the page behind can't be clicked)
  useEffect(function () {
    if (!dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  function saveName() {
    const newName = name.trim();
    if (newName === "") {
      setName(task.text);   // an empty name isn't allowed: put the old one back
    } else if (newName !== task.text) {
      onUpdate({ text: newName });
    }
  }

  // A reminder needs a day: with no due date yet, it's today
  function setReminder(time) {
    onUpdate(time && !task.dueDate ? { remindAt: time, dueDate: todayString() } : { remindAt: time });
  }

  const starLabel = task.focus ? "Remove from Today" : "Add to Today";

  return (
    <dialog className="coach task-details" ref={dialog} onClose={onClose} aria-label={task.text}>
      <div className="coach-top">
        <p className="coach-step">Task</p>
        <button className="coach-close" aria-label="Close" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>

      {/* The name: tick box, an editable title, the Today star */}
      <div className={"details-title priority-" + task.priority}>
        <input type="checkbox" className="details-tick" aria-label={task.done ? "Mark as not done" : "Mark as done"} checked={task.done} onChange={onToggle} />
        <textarea
          className={task.done ? "details-name done" : "details-name"}
          aria-label="Task name"
          rows="1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.target.blur();   // Enter saves the name
            }
          }}
        />
        <button type="button" className={task.focus ? "icon-button focus-button on" : "icon-button focus-button"} title={starLabel} aria-label={starLabel} onClick={() => onUpdate({ focus: !task.focus })}>
          <Icon name="star" />
        </button>
      </div>

      {/* The details, as a tidy grid of labels and boxes */}
      <div className="details-grid">
        <label htmlFor="details-list">List</label>
        <select id="details-list" value={task.status} onChange={(event) => onUpdate({ status: event.target.value })}>
          {Object.keys(LIST_NAMES).map((listKey) => (
            <option key={listKey} value={listKey}>{LIST_NAMES[listKey]}</option>
          ))}
        </select>

        <label htmlFor="details-priority">Priority</label>
        <select id="details-priority" value={task.priority} onChange={(event) => onUpdate({ priority: event.target.value })}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <label htmlFor="details-date">Due date</label>
        <input id="details-date" type="date" value={task.dueDate} onChange={(event) => onUpdate({ dueDate: event.target.value })} />

        <label htmlFor="details-repeat">Repeat</label>
        <select id="details-repeat" value={task.repeat} onChange={(event) => onUpdate({ repeat: event.target.value })}>
          <option value="">Doesn’t repeat</option>
          {Object.keys(REPEAT_NAMES).map((repeat) => (
            <option key={repeat} value={repeat}>{REPEAT_NAMES[repeat]}</option>
          ))}
        </select>

        <label htmlFor="details-remind">Reminder</label>
        <input id="details-remind" type="time" value={task.remindAt} onChange={(event) => setReminder(event.target.value)} />
      </div>

      <h3 className="details-heading">Notes</h3>
      <NotesEditor className="notes-box" label="Notes" value={task.notes} onChange={(notes) => onUpdate({ notes })} />

      <h3 className="details-heading">Steps</h3>
      <StepList steps={task.steps} onChange={(steps) => onUpdate({ steps })} onAllDone={onAllSteps} />

      <div className="details-actions">
        <button type="button" className="details-delete" onClick={onDelete}>
          <Icon name="trash" /> Delete
        </button>
        <button type="button" className="coach-answer main details-done" onClick={onToggle}>
          {task.done ? "Mark as not done" : "Mark as done"}
        </button>
      </div>
    </dialog>
  );
}
