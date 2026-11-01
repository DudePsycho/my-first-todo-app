// ONE TASK CARD. In the plain version, createTask() built this piece by piece with
// createElement and addEventListener. Here we write what the card LOOKS like, as HTML-ish JSX,
// and React builds it. The task's data comes in as "props" (the attributes on <TaskItem ... />)
import { useState } from "react";
import Icon from "./Icon.jsx";
import { LIST_NAMES, REPEAT_NAMES, TAG_PATTERN, findLinks, tagColor, todayString } from "./tasks.js";

// The task text, with @ and # words turned into little chips
// (...rest = any other attributes, like role or onKeyDown, passed straight to the span)
export function TaskText({ text, className, ...rest }) {
  // split() with the pattern gives: [plain text, tag, plain text, tag, ...]
  const parts = text.split(TAG_PATTERN);
  return (
    <span className={className} {...rest}>
      {/* map() turns each part into a piece of page. Odd places are tags, even places are text */}
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          // style={{ ... }} sets a CSS variable right on this chip: its own color
          <span key={index} className="tag" style={{ "--tag-color": tagColor(part) }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

// The due date label, e.g. "Due 3 Nov" (pink when it has passed)
export function DueDate({ date }) {
  if (!date) {
    return <small className="due-date"></small>;   // no date: an empty label (the CSS hides it)
  }
  const niceDate = new Date(date + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const isOverdue = date < todayString();
  return <small className={isOverdue ? "due-date overdue" : "due-date"}>Due {niceDate}</small>;
}

// THE STEPS (sub-tasks): a small checklist. Used inside a task's panel AND under the
// new-task box, so it only gets the steps and a function to hand back the changed list.
// onAllDone (optional) is called when the last unticked step gets ticked
export function StepList({ steps, onChange, onAllDone }) {
  const [draft, setDraft] = useState("");   // what's typed in "Add a step"

  // Change one step, e.g. change(1, { done: true })
  function change(index, changes) {
    const newSteps = steps.map((step, n) => (n === index ? { ...step, ...changes } : step));
    onChange(newSteps);
    if (changes.done && onAllDone && newSteps.every((step) => step.done)) {
      onAllDone(newSteps.length);
    }
  }

  function remove(index) {
    onChange(steps.filter((step, n) => n !== index));
  }

  // Enter in "Add a step" adds it to the end
  function addOnEnter(event) {
    if (event.key !== "Enter" || draft.trim() === "") {
      return;
    }
    onChange([...steps, { text: draft.trim(), done: false }]);
    setDraft("");
  }

  return (
    <div className="steps">
      {steps.map((step, index) => (
        <div className="step" key={index}>
          <input type="checkbox" aria-label="Step done" checked={step.done} onChange={() => change(index, { done: !step.done })} />
          {/* The step's text is a text box that looks like plain text: tap it to change it.
              Emptied and left: the step is removed */}
          <input
            type="text"
            className={step.done ? "step-text done" : "step-text"}
            aria-label="Step"
            value={step.text}
            onChange={(event) => change(index, { text: event.target.value })}
            onBlur={() => step.text.trim() === "" && remove(index)}
          />
          <button className="icon-button step-remove" title="Remove step" aria-label="Remove step" onClick={() => remove(index)}>
            <Icon name="x" />
          </button>
        </div>
      ))}
      <input
        type="text"
        className="step-add"
        placeholder="Add a step"
        aria-label="Add a step"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={addOnEnter}
      />
    </div>
  );
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete, onMove, onStar, onAllSteps }) {
  // This card's own memory: is it being edited, and what's in the edit boxes
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftRepeat, setDraftRepeat] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);   // is the notes panel open

  // The Edit button has two modes: "Edit" starts editing, "Save" saves
  function editOrSave() {
    if (!isEditing) {
      setDraftText(task.text);
      setDraftDate(task.dueDate);
      setDraftRepeat(task.repeat);
      setIsEditing(true);
      return;
    }
    const newText = draftText.trim();
    if (newText === "") {
      return;   // don't allow an empty task
    }
    onUpdate({ text: newText, dueDate: draftDate, repeat: draftRepeat });
    setIsEditing(false);
  }

  const starLabel = task.focus ? "Remove from today" : "Add to today";
  const stepsDone = task.steps.filter((step) => step.done).length;

  // A tap anywhere on the card opens or closes its notes and steps, EXCEPT on the
  // things that have their own job (tick box, star, pickers, buttons, links) and
  // inside the open panel itself. closest() looks at the tapped thing and its parents
  function cardClicked(event) {
    if (!event.target.closest("button, input, select, textarea, a, .notes-panel")) {
      setNotesOpen(!notesOpen);
    }
  }

  // Keyboard users: the task text can be reached with Tab, and Enter or Space opens it
  function textKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setNotesOpen(!notesOpen);
    }
  }

  // While editing, the edit boxes take the place of the text and the date.
  // value={...} + onChange is how React handles a text box: the box always shows what's in memory
  return (
    <li className={"priority-" + task.priority + (notesOpen ? " notes-open" : "") + (task.steps.length > 0 ? " has-steps" : "")} onClick={cardClicked}>
      <input type="checkbox" checked={task.done} onChange={onToggle} />

      {isEditing ? (
        <input type="text" className="edit-text" value={draftText} onChange={(event) => setDraftText(event.target.value)} />
      ) : (
        <TaskText
          text={task.text}
          className={task.done ? "task-text done" : "task-text"}
          role="button"
          tabIndex={0}
          aria-expanded={notesOpen}
          title={notesOpen ? "Hide notes and steps" : "Show notes and steps"}
          onKeyDown={textKeyDown}
        />
      )}

      {isEditing ? (
        <input type="date" className="edit-date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} />
      ) : (
        <DueDate date={task.dueDate} />
      )}

      {/* Repeating: a small tag like "↻ Weekly", or a dropdown while editing */}
      {isEditing ? (
        <select className="edit-repeat" aria-label="Repeat" value={draftRepeat} onChange={(event) => setDraftRepeat(event.target.value)}>
          <option value="">No repeat</option>
          {Object.keys(REPEAT_NAMES).map((repeat) => (
            <option key={repeat} value={repeat}>{REPEAT_NAMES[repeat]}</option>
          ))}
        </select>
      ) : (
        task.repeat && (
          <small className="repeat-tag" title={"Repeats " + task.repeat}>
            <Icon name="repeat" /><span className="repeat-word">{REPEAT_NAMES[task.repeat]}</span>
          </small>
        )
      )}

      <button className={task.focus ? "icon-button focus-button on" : "icon-button focus-button"} title={starLabel} aria-label={starLabel} onClick={onStar}>
        <Icon name="star" />
      </button>

      <select className="status-select" title="Move to another list" value={task.status} onChange={(event) => onMove(event.target.value)}>
        {Object.keys(LIST_NAMES).map((listKey) => (
          <option key={listKey} value={listKey}>{LIST_NAMES[listKey]}</option>
        ))}
      </select>

      <button className="icon-button edit-button" title={isEditing ? "Save" : "Edit task"} aria-label={isEditing ? "Save" : "Edit task"} onClick={editOrSave}>
        <Icon name={isEditing ? "check" : "pencil"} />
      </button>

      <button className="icon-button delete-button" title="Delete task" aria-label="Delete task" onClick={onDelete}>
        <Icon name="trash" />
      </button>

      {/* THE STEPS PROGRESS: a thin bar on its own line under the task, filling with mint.
          scaleX(0.5) = half full (the same trick as the sidebar's progress bar) */}
      {task.steps.length > 0 && (
        <span className="steps-bar" title={stepsDone + " of " + task.steps.length + " steps done"}>
          <span className="steps-track" role="progressbar" aria-label="Steps done" aria-valuemin="0" aria-valuemax={task.steps.length} aria-valuenow={stepsDone}>
            <span className="steps-fill" style={{ transform: "scaleX(" + stepsDone / task.steps.length + ")" }}></span>
          </span>
        </span>
      )}

      {/* THE NOTES PANEL, on its own line under the card. Every key you type is saved
          straight away (onUpdate), so there's no Save button. Links show underneath,
          then the steps */}
      {notesOpen && (
        <div className="notes-panel">
          <textarea
            className="notes-box"
            aria-label="Notes"
            placeholder="Add notes or links"
            rows="3"
            value={task.notes}
            onChange={(event) => onUpdate({ notes: event.target.value })}
          />
          {findLinks(task.notes).map((link, index) => (
            // target="_blank" opens a new tab; rel="noopener noreferrer" stops that tab from reaching back into ours
            <a key={index} className="note-link" href={link} target="_blank" rel="noopener noreferrer">
              {link.replace(/^https?:\/\//, "")}
            </a>
          ))}
          <StepList steps={task.steps} onChange={(steps) => onUpdate({ steps })} onAllDone={onAllSteps} />
        </div>
      )}
    </li>
  );
}
