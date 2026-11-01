// ONE TASK CARD. In the plain version, createTask() built this piece by piece with
// createElement and addEventListener. Here we write what the card LOOKS like, as HTML-ish JSX,
// and React builds it. The task's data comes in as "props" (the attributes on <TaskItem ... />)
import { useState } from "react";
import Icon from "./Icon.jsx";
import { LIST_NAMES, REPEAT_NAMES, TAG_PATTERN, tagColor, todayString } from "./tasks.js";

// The task text, with @ and # words turned into little chips
export function TaskText({ text, className }) {
  // split() with the pattern gives: [plain text, tag, plain text, tag, ...]
  const parts = text.split(TAG_PATTERN);
  return (
    <span className={className}>
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

export default function TaskItem({ task, onToggle, onUpdate, onDelete, onMove, onStar }) {
  // This card's own memory: is it being edited, and what's in the edit boxes
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftRepeat, setDraftRepeat] = useState("");

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

  // While editing, the edit boxes take the place of the text and the date.
  // value={...} + onChange is how React handles a text box: the box always shows what's in memory
  return (
    <li className={"priority-" + task.priority}>
      <input type="checkbox" checked={task.done} onChange={onToggle} />

      {isEditing ? (
        <input type="text" className="edit-text" value={draftText} onChange={(event) => setDraftText(event.target.value)} />
      ) : (
        <TaskText text={task.text} className={task.done ? "task-text done" : "task-text"} />
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
    </li>
  );
}
