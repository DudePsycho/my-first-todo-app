// THE CALENDAR: your tasks on the days they're due (weeks start on Monday), four ways:
//   Month · Week · Day (by reminder time) · Agenda (a list of the coming days)
//   - drag a task to another day (or, in the Day view, to another time)
//   - tasks with no date wait in the "No date" panel: drag one onto a day to give it a date,
//     or drag a task back into the panel to take its date away
//   - repeating tasks also show (faded) on the days they'll come back
//   - "+" on a day adds a task due that day; click a day to list its tasks under the calendar
//   - keyboard: the arrow keys move between days, Enter lists the day, N (or +) adds a task
//   - click the title to jump to any date
// On phones the month shows a count on each day instead of the tasks, and you tap a day
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, pointerWithin, rectIntersection, useDraggable, useDroppable } from "@dnd-kit/core";
import Icon from "./Icon.jsx";
import TaskComposer from "./TaskComposer.jsx";
import { AUTO_SCROLL, BOUNCE_MS, dropAnimation, useDragSensors } from "./dragFeel.js";
import { dateString, monthDay, nextDueDate, plusDays, toDate, parseQuickAdd, recall, remember, shortDay, todayString } from "./tasks.js";
import { usePhone } from "./usePhone.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIORITY_ORDER = ["high", "medium", "low"];
const MODES = { month: "Month", week: "Week", day: "Day", agenda: "Agenda" };
const AGENDA_DAYS = 28;

// The same day a month before or after (the 31st becomes the last day of a shorter month)
function plusMonths(text, months) {
  const date = toDate(text);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return dateString(date);
}

// The Monday of that date's week (getDay() is 0 on Sunday, 1 on Monday...)
function mondayOf(text) {
  return plusDays(text, -((toDate(text).getDay() + 6) % 7));
}

function weekdayOf(text) {
  return WEEKDAYS[(toDate(text).getDay() + 6) % 7];
}

// "Monday 2 November": for screen readers and headings
function longDay(text) {
  return toDate(text).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// The days to draw: a whole week, every week that touches the month, one day, or the agenda's days
function daysToShow(anchor, mode) {
  if (mode === "day") {
    return [anchor];
  }
  let first = mondayOf(anchor);
  let last = plusDays(first, 6);
  if (mode === "month") {
    first = mondayOf(anchor.slice(0, 8) + "01");
    const monthEnd = toDate(anchor);
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0);   // day 0 of next month = this month's last day
    last = plusDays(mondayOf(dateString(monthEnd)), 6);
  }
  if (mode === "agenda") {
    first = anchor;
    last = plusDays(anchor, AGENDA_DAYS - 1);
  }
  const days = [];
  for (let day = first; day <= last; day = plusDays(day, 1)) {
    days.push(day);
  }
  return days;
}

// What's on each day: { "2026-11-05": [{ task, visit }] }. A "visit" is a repeating task's
// future day, worked out with the same nextDueDate the app uses when you tick it
function tasksByDay(tasks, firstDay, lastDay) {
  const byDay = {};
  function put(day, task, visit) {
    if (day >= firstDay && day <= lastDay) {
      byDay[day] = byDay[day] || [];
      byDay[day].push({ task, visit });
    }
  }
  tasks.forEach((task) => {
    if (task.dueDate === "") {
      return;
    }
    put(task.dueDate, task, false);
    if (task.repeat && !task.done) {
      let day = task.dueDate;
      for (let step = 0; step < 62; step++) {   // at most 62 visits (a month of dailies, twice)
        day = nextDueDate({ ...task, dueDate: day, repeatDay: monthDay(task) });
        if (day > lastDay) {
          break;
        }
        put(day, task, true);
      }
    }
  });
  // In each day: tasks with a time first (by time), then the rest; finished ones last
  Object.values(byDay).forEach((entries) =>
    entries.sort((a, b) => Number(a.task.done) - Number(b.task.done) || (a.task.remindAt || "99").localeCompare(b.task.remindAt || "99"))
  );
  return byDay;
}

// Where a dragged task would land: the day (or time) under the POINTER. The keyboard has no
// pointer: then the place the task overlaps most
function whereToDrop(args) {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
}

// ---------- ONE TASK ON THE CALENDAR ----------
function ChipFace({ entry, showTime = true }) {
  const { task, visit } = entry;
  return (
    <>
      {(visit || task.repeat) && <Icon name="repeat" className="cal-chip-icon" />}
      <span className="cal-chip-text">{task.text}</span>
      {task.remindAt && !task.done && !visit && (
        <span className="cal-chip-time">
          <Icon name="bell" className="cal-chip-icon" />
          {showTime && <span className="cal-time-text">{task.remindAt}</span>}
        </span>
      )}
    </>
  );
}

// A task you can drag to another day (repeat visits and finished tasks stay put)
function Chip({ entry, day, canDrag, landed, showTime, onOpen }) {
  const { task, visit } = entry;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id + (visit ? "@" + day : ""), data: { task }, disabled: !canDrag });
  const overdue = !task.done && task.dueDate !== "" && task.dueDate < todayString();
  let className = "cal-chip priority-" + task.priority;
  className += visit ? " visit" : "";
  className += task.done ? " is-done" : "";
  className += overdue ? " overdue" : "";
  className += isDragging ? " slot" : "";
  className += landed ? " just-dropped" : "";
  return (
    <li
      ref={setNodeRef}
      className={className}
      title={visit ? task.text + " (repeats)" : task.text}
      {...attributes}
      aria-label={task.text + (visit ? ", repeats" : "") + (task.remindAt ? ", at " + task.remindAt : "") + ". Enter opens it" + (canDrag ? ", Space moves it" : "")}
      {...listeners}
      onClick={(event) => {
        event.stopPropagation();   // don't also choose the day
        onOpen(task.id);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();   // the day's arrow keys are for days, not tasks
        if (event.key === "Enter") {
          onOpen(task.id);
          return;
        }
        if (listeners && listeners.onKeyDown) {
          listeners.onKeyDown(event);
        }
      }}
    >
      <ChipFace entry={entry} showTime={showTime} />
    </li>
  );
}

// A small box to type a new task (Enter adds it, Escape closes it)
function AddBox({ label, onAdd, onClose }) {
  const [text, setText] = useState("");
  return (
    <input
      type="text"
      className="cal-add-input"
      aria-label={label}
      placeholder="New task, then Enter"
      autoFocus
      value={text}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          onClose();
        }
        if (event.key === "Enter" && text.trim() !== "") {
          onAdd(text);
          setText("");
        }
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => text.trim() === "" && onClose()}
    />
  );
}

// ---------- ONE DAY (month and week) ----------
function Day({ day, entries, month, mode, isPhone, chosen, focused, adding, landed, onChoose, onOpen, onFocusDay, onKey, onStartAdd, onAdd, onStopAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: "day:" + day });
  const today = todayString();
  const outside = mode === "month" && day.slice(0, 7) !== month;   // a day from the month before or after
  const limit = mode === "month" ? 3 : 99;
  const shown = entries.slice(0, limit);
  const more = entries.length - shown.length;
  const open = entries.filter((entry) => !entry.task.done && !entry.visit);
  // Phones: the day's colour is its most urgent task's priority
  const top = PRIORITY_ORDER.find((priority) => open.some((entry) => entry.task.priority === priority));

  let className = "cal-day";
  className += day === today ? " today" : "";
  className += day < today ? " past" : "";
  className += outside ? " outside" : "";
  className += isOver ? " over" : "";
  className += chosen ? " chosen" : "";

  return (
    <div
      ref={setNodeRef}
      className={className}
      data-day={day}
      role="gridcell"
      tabIndex={focused ? 0 : -1}
      aria-selected={chosen}
      aria-label={longDay(day) + (day === today ? ", today" : "") + ", " + (entries.length === 1 ? "1 task" : entries.length + " tasks")}
      onClick={() => onChoose(day)}
      onFocus={(event) => event.target === event.currentTarget && onFocusDay(day)}
      onKeyDown={(event) => onKey(event, day)}
    >
      <div className="cal-day-top">
        <span className="cal-date" aria-hidden="true">
          {mode === "week" || isPhone ? <span className="cal-weekday">{weekdayOf(day)}</span> : null}
          {toDate(day).getDate()}
        </span>
        {!(isPhone && mode === "month") && (
          <button type="button" className="cal-plus" tabIndex={-1} aria-label={"Add a task on " + longDay(day)} title="Add a task on this day" onClick={(event) => { event.stopPropagation(); onStartAdd(day); }}>
            <Icon name="plus" />
          </button>
        )}
      </div>
      {isPhone && mode === "month" ? (
        entries.length > 0 && <span className={"cal-count priority-" + (top || "done")} aria-hidden="true">{entries.length}</span>
      ) : (
        <ul className="cal-chips">
          {shown.map((entry) => (
            <Chip key={entry.task.id + (entry.visit ? "@" + day : "")} entry={entry} day={day} canDrag={!entry.visit && !entry.task.done} landed={landed.includes(entry.task.id) && !entry.visit} showTime={mode === "week"} onOpen={onOpen} />
          ))}
          {more > 0 && (
            <li>
              <button type="button" className="cal-more" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onChoose(day); }}>
                +{more} more
              </button>
            </li>
          )}
        </ul>
      )}
      {adding && <AddBox label={"New task on " + longDay(day)} onAdd={(text) => onAdd(text, day)} onClose={onStopAdd} />}
    </div>
  );
}

// ---------- THE DAY VIEW: the day by reminder time ----------
// One half-hour row. Dropping a task here sets its time; clicking an empty row adds one
function TimeSlot({ day, time, entries, landed, adding, onOpen, onStartAdd, onAdd, onStopAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: "slot:" + day + "|" + time });
  const fullHour = time.endsWith(":00");
  return (
    <div ref={setNodeRef} className={"cal-slot" + (fullHour ? " hour" : "") + (isOver ? " over" : "")} data-time={time} onClick={() => entries.length === 0 && onStartAdd(time)}>
      <span className="cal-slot-label">{fullHour ? time : ""}</span>
      <ul className="cal-chips">
        {entries.map((entry) => (
          <Chip key={entry.task.id} entry={entry} day={day} canDrag={!entry.task.done} landed={landed.includes(entry.task.id)} showTime onOpen={onOpen} />
        ))}
      </ul>
      {adding && <AddBox label={"New task at " + time} onAdd={(text) => onAdd(text, day, time)} onClose={onStopAdd} />}
    </div>
  );
}

// "Any time": the day's tasks with no reminder time (drop one here to take its time away)
function AnyTime({ day, entries, landed, onOpen, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: "anytime:" + day });
  return (
    <div ref={setNodeRef} className={"cal-anytime" + (isOver ? " over" : "")} data-day={day}>
      <h3>Any time</h3>
      <ul className="cal-chips">
        {entries.map((entry) => (
          <Chip key={entry.task.id + (entry.visit ? "@" : "")} entry={entry} day={day} canDrag={!entry.visit && !entry.task.done} landed={landed.includes(entry.task.id)} showTime onOpen={onOpen} />
        ))}
      </ul>
      {children}
    </div>
  );
}

// The half-hours from 6:00 to 23:30 (from earlier, if a task already has an earlier time)
function slotTimes(entries) {
  const times = [];
  const earliest = entries.reduce((first, entry) => (entry.task.remindAt && entry.task.remindAt < first ? entry.task.remindAt : first), "06:00");
  for (let hour = Number(earliest.slice(0, 2)); hour < 24; hour++) {
    const hh = String(hour).padStart(2, "0");
    times.push(hh + ":00", hh + ":30");
  }
  return times;
}

// The half-hour a time falls in: "09:40" → "09:30"
function slotOf(time) {
  return time.slice(0, 3) + (Number(time.slice(3)) < 30 ? "00" : "30");
}

// ---------- THE "NO DATE" PANEL ----------
// Tasks without a date, and a place to drop a task to clear its date
function NoDate({ tasks, isPhone, landed, onOpen, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: "nodate" });
  const [adding, setAdding] = useState(false);
  return (
    <aside ref={setNodeRef} className={isOver ? "cal-nodate over" : "cal-nodate"} aria-label="Tasks with no date">
      <h3>No date <span className="count">{tasks.length}</span></h3>
      <p className="cal-hint">{isPhone ? "Open a task to give it a date" : "Drag onto a day to give it that date. Drag a task here to take its date away"}</p>
      <ul className="cal-chips">
        {tasks.map((task) => (
          <Chip key={task.id} entry={{ task, visit: false }} day="" canDrag={!isPhone} landed={landed.includes(task.id)} showTime onOpen={onOpen} />
        ))}
      </ul>
      {adding ? (
        <TaskComposer label="New task with no date" onAdd={(text) => onAdd(text, "")} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" className="board-add" onClick={() => setAdding(true)}>+ Add a task</button>
      )}
    </aside>
  );
}

// tasks: the tasks that fit the sidebar filter and search. actions: what the calendar may do
export default function Calendar({ tasks, actions }) {
  const isPhone = usePhone();
  const [mode, setMode] = useState(() => (MODES[recall("calendar-mode")] ? recall("calendar-mode") : "month"));
  const [anchor, setAnchor] = useState(todayString);      // a day in the month (or week...) on show
  const [focusDay, setFocusDay] = useState(todayString);  // the day the arrow keys are on
  const [chosenDay, setChosenDay] = useState("");        // the day listed under the calendar
  const [adding, setAdding] = useState("");              // where an add box is open: a day, "day|time" or "list:day"
  const [dragged, setDragged] = useState(null);
  const [landed, setLanded] = useState([]);
  const jumpBox = useRef(null);
  const moveFocus = useRef(false);   // true right after an arrow key: put the focus on the new day
  const grid = useRef(null);

  const days = daysToShow(anchor, mode);
  const byDay = tasksByDay(tasks, days[0], days[days.length - 1]);
  const noDate = tasks.filter((task) => !task.done && task.dueDate === "");
  const month = anchor.slice(0, 7);
  const today = todayString();

  // After the arrow keys move to another day, the keyboard focus follows it
  useEffect(
    function () {
      if (moveFocus.current && grid.current) {
        moveFocus.current = false;
        const cell = grid.current.querySelector('[data-day="' + focusDay + '"]');
        if (cell) {
          cell.focus();
        }
      }
    },
    [focusDay, anchor]
  );

  // The title: "November 2026", "2 Nov – 8 Nov 2026", "Monday 2 November"...
  let title = toDate(anchor).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (mode === "week" || mode === "agenda") {
    title = toDate(days[0]).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " – " + toDate(days[days.length - 1]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } else if (mode === "day") {
    title = longDay(anchor);
  }

  function chooseMode(value) {
    setMode(value);
    remember("calendar-mode", value);
    setAdding("");
  }

  // ‹ and ›: a month, a week, a day or 4 weeks back or forward
  function step(direction) {
    let next = plusMonths(anchor, direction);
    if (mode === "week") next = plusDays(anchor, 7 * direction);
    if (mode === "day") next = plusDays(anchor, direction);
    if (mode === "agenda") next = plusDays(anchor, AGENDA_DAYS * direction);
    setAnchor(next);
    setFocusDay(next);
  }

  function goTo(day) {
    setAnchor(day);
    setFocusDay(day);
  }

  // "Jump to a date": the browser's own date picker
  function openJump() {
    if (jumpBox.current.showPicker) {
      jumpBox.current.showPicker();
    } else {
      jumpBox.current.focus();
    }
  }

  function chooseDay(day) {
    setChosenDay(chosenDay === day ? "" : day);
    setFocusDay(day);
  }

  // The arrow keys move between days (into the next month or week when needed)
  function dayKey(event, day) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = "";
    if (moves[event.key] !== undefined) {
      next = plusDays(day, moves[event.key]);
    } else if (event.key === "Home") {
      next = mondayOf(day);
    } else if (event.key === "End") {
      next = plusDays(mondayOf(day), 6);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      next = plusMonths(day, event.key === "PageUp" ? -1 : 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseDay(day);
      return;
    } else if (event.key === "n" || event.key === "N" || event.key === "+") {
      event.preventDefault();
      setAdding(day);
      return;
    } else {
      return;
    }
    event.preventDefault();
    moveFocus.current = true;
    setFocusDay(next);
    if (!days.includes(next)) {
      setAnchor(next);   // off the screen: show its month (or week)
    }
  }

  // ---------- ADDING ----------
  function addOn(text, day, time = "") {
    const quick = parseQuickAdd(text);
    if (quick.text === "") {
      return;
    }
    // The day (and time) you added it on win; anything typed fills in the rest
    actions.add(quick.text, { priority: quick.priority, repeat: quick.repeat, remindAt: time || quick.remindAt, dueDate: day });
    actions.say(day ? "Added for " + shortDay(day) + (time ? " at " + time : "") : "Added, with no date");
  }

  // ---------- DRAGGING ----------
  // Dropped on a day: that date. On a time (Day view): that date and time. On "Any time":
  // that date, no time. On "No date": no date
  function dropped({ active, over }) {
    setDragged(null);
    if (!over) {
      return;
    }
    const task = active.data.current.task;
    let changes = { dueDate: "" };
    let message = "Date taken away";
    if (over.id.startsWith("day:")) {
      changes = { dueDate: over.id.slice(4) };
      message = "Moved to " + shortDay(changes.dueDate);
    } else if (over.id.startsWith("anytime:")) {
      changes = { dueDate: over.id.slice(8), remindAt: "" };
      message = "Moved to " + shortDay(changes.dueDate) + ", any time";
    } else if (over.id.startsWith("slot:")) {
      const [day, time] = over.id.slice(5).split("|");
      changes = { dueDate: day, remindAt: time };
      message = "Moved to " + shortDay(day) + " at " + time;
    }
    const changed = Object.keys(changes).some((key) => changes[key] !== task[key]);
    if (changed) {
      actions.update(task.id, changes);
      actions.say(message);
    }
    setLanded([task.id]);
    setTimeout(() => setLanded([]), BOUNCE_MS);
  }

  const sensors = useDragSensors();
  const nameOf = (active) => active.data.current.task.text;
  const placeOf = (over) => {
    if (!over) return "nowhere";
    if (over.id === "nodate") return "No date";
    if (over.id.startsWith("slot:")) return shortDay(over.id.slice(5, 15)) + " at " + over.id.slice(16);
    if (over.id.startsWith("anytime:")) return shortDay(over.id.slice(8)) + ", any time";
    return shortDay(over.id.slice(4));
  };
  const accessibility = {
    screenReaderInstructions: { draggable: "To move a task to another day, press Space, use the arrow keys, then Space again. Escape cancels. Enter opens the task." },
    announcements: {
      onDragStart: ({ active }) => "Picked up " + nameOf(active),
      onDragOver: ({ active, over }) => nameOf(active) + " is over " + placeOf(over),
      onDragEnd: ({ active, over }) => "Dropped " + nameOf(active) + " on " + placeOf(over),
      onDragCancel: ({ active }) => "Stopped moving " + nameOf(active)
    }
  };

  const chosenEntries = chosenDay ? tasksByDay(tasks, chosenDay, chosenDay)[chosenDay] || [] : [];
  const dayEntries = mode === "day" ? byDay[anchor] || [] : [];
  // Agenda: overdue tasks first (when it starts today), then each day that has tasks
  const overdue = mode === "agenda" && anchor === today ? tasks.filter((task) => !task.done && task.dueDate !== "" && task.dueDate < today) : [];
  const focused = days.includes(focusDay) ? focusDay : days.includes(today) ? today : days[0];

  // A tapped task in a list (agenda, the chosen day)
  function row(entry, extra) {
    return (
      <li key={entry.task.id + (entry.visit ? "@" : "")}>
        <button type="button" className={"cal-row priority-" + entry.task.priority + (entry.task.done ? " is-done" : "") + (entry.visit ? " visit" : "")} onClick={() => actions.open(entry.task.id)}>
          <ChipFace entry={entry} />
          {entry.visit && <small className="cal-hint">repeats</small>}
          {extra}
        </button>
      </li>
    );
  }

  return (
    <section className={"calendar " + mode} aria-label="Calendar">
      <div className="cal-bar">
        <div className="cal-nav">
          <button type="button" className="icon-button" aria-label={"Previous " + (mode === "agenda" ? "4 weeks" : mode)} onClick={() => step(-1)}>
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="cal-today" onClick={() => goTo(today)}>Today</button>
          <button type="button" className="icon-button" aria-label={"Next " + (mode === "agenda" ? "4 weeks" : mode)} onClick={() => step(1)}>
            <Icon name="chevron-right" />
          </button>
          <span className="cal-jump">
            <button type="button" className="cal-title" title="Jump to a date" aria-label={title + ". Jump to a date"} onClick={openJump}>
              {title} <Icon name="chevron-down" />
            </button>
            <input ref={jumpBox} type="date" className="cal-jump-input" tabIndex={-1} aria-hidden="true" value={anchor} onChange={(event) => event.target.value && goTo(event.target.value)} />
          </span>
        </div>
        <div className="view-tabs small" role="group" aria-label="Calendar view">
          {Object.keys(MODES).map((key) => (
            <button key={key} type="button" className={mode === key ? "chosen" : ""} aria-pressed={mode === key} onClick={() => chooseMode(key)}>
              {MODES[key]}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={whereToDrop} autoScroll={AUTO_SCROLL} accessibility={accessibility} onDragStart={({ active }) => setDragged(active.data.current.task)} onDragEnd={dropped} onDragCancel={() => setDragged(null)}>
        <div className="cal-layout">
          <div className="cal-main">
            {/* MONTH AND WEEK: a grid of days */}
            {(mode === "month" || mode === "week") && (
              <>
                {(mode === "month" || !isPhone) && (
                  <div className="cal-weekdays" aria-hidden="true">
                    {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
                  </div>
                )}
                <div className="cal-grid" ref={grid} role="grid" aria-label={title + ". Arrow keys move between days, Enter lists a day, N adds a task"}>
                  {days.map((day) => (
                    <Day
                      key={day}
                      day={day}
                      entries={byDay[day] || []}
                      month={month}
                      mode={mode}
                      isPhone={isPhone}
                      chosen={day === chosenDay}
                      focused={day === focused}
                      adding={adding === day}
                      landed={landed}
                      onChoose={chooseDay}
                      onOpen={actions.open}
                      onFocusDay={setFocusDay}
                      onKey={dayKey}
                      onStartAdd={setAdding}
                      onAdd={addOn}
                      onStopAdd={() => setAdding("")}
                    />
                  ))}
                </div>
              </>
            )}

            {/* DAY: the tasks by their reminder time, half an hour per row */}
            {mode === "day" && (
              <div className="cal-dayview">
                <AnyTime day={anchor} entries={dayEntries.filter((entry) => !entry.task.remindAt || entry.visit)} landed={landed} onOpen={actions.open}>
                  {adding === anchor ? (
                    <TaskComposer label={"New task on " + longDay(anchor)} onAdd={(text) => addOn(text, anchor)} onClose={() => setAdding("")} />
                  ) : (
                    <button type="button" className="board-add" onClick={() => setAdding(anchor)}>+ Add a task</button>
                  )}
                </AnyTime>
                <div className="cal-times" aria-label="By time">
                  {slotTimes(dayEntries).map((time) => (
                    <TimeSlot
                      key={time}
                      day={anchor}
                      time={time}
                      entries={dayEntries.filter((entry) => entry.task.remindAt && !entry.visit && slotOf(entry.task.remindAt) === time)}
                      landed={landed}
                      adding={adding === anchor + "|" + time}
                      onOpen={actions.open}
                      onStartAdd={(slot) => setAdding(anchor + "|" + slot)}
                      onAdd={addOn}
                      onStopAdd={() => setAdding("")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AGENDA: the coming days, as a list */}
            {mode === "agenda" && (
              <div className="cal-agenda">
                {overdue.length > 0 && (
                  <section className="agenda-day overdue">
                    <h3>Overdue</h3>
                    <ul className="cal-daylist-items">
                      {overdue.map((task) => row({ task, visit: false }, <small className="cal-hint">{shortDay(task.dueDate)}</small>))}
                    </ul>
                  </section>
                )}
                {days.filter((day) => byDay[day]).map((day) => (
                  <section key={day} className={day === today ? "agenda-day today" : "agenda-day"}>
                    <h3>
                      <button type="button" className="agenda-day-name" title="Show this day by time" onClick={() => { goTo(day); chooseMode("day"); }}>
                        {day === today ? "Today · " : ""}{longDay(day)}
                      </button>
                    </h3>
                    <ul className="cal-daylist-items">{byDay[day].map((entry) => row(entry))}</ul>
                  </section>
                ))}
                {overdue.length === 0 && !days.some((day) => byDay[day]) && <p className="no-results">Nothing in these 4 weeks</p>}
              </div>
            )}

            {/* The chosen day's tasks, as a list under the calendar (with its own add box) */}
            {chosenDay && (mode === "month" || mode === "week") && (
              <div className="cal-daylist">
                <div className="cal-daylist-head">
                  <h3>{longDay(chosenDay)}</h3>
                  <button type="button" className="icon-button" aria-label="Close the day" onClick={() => setChosenDay("")}>
                    <Icon name="x" />
                  </button>
                </div>
                {chosenEntries.length === 0 && <p className="cal-hint">Nothing on this day</p>}
                <ul className="cal-daylist-items">{chosenEntries.map((entry) => row(entry))}</ul>
                {adding === "list:" + chosenDay ? (
                  <TaskComposer label={"New task on " + longDay(chosenDay)} onAdd={(text) => addOn(text, chosenDay)} onClose={() => setAdding("")} />
                ) : (
                  <button type="button" className="board-add" onClick={() => setAdding("list:" + chosenDay)}>+ Add a task</button>
                )}
              </div>
            )}
          </div>
          <NoDate tasks={noDate} isPhone={isPhone} landed={landed} onOpen={actions.open} onAdd={addOn} />
        </div>

        {/* The lifted task that follows the pointer, drawn straight into the page's body */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation()}>
            {dragged && (
              <div className={"cal-chip lifted priority-" + dragged.priority}>
                <ChipFace entry={{ task: dragged, visit: false }} />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </section>
  );
}
