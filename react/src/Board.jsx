// THE BOARD: your tasks as cards in columns (a "kanban board"). Drag a card to another
// column to change it, or up and down to change the order (the list view follows that order).
//
//   Group by   Lists:    Inbox · Next · Waiting · Someday · Done
//              Priority: High · Medium · Low · Done
//              Due date: Overdue · Today · Next 7 days · Later · No date · Done
//
// Also: "+ Add a task" in each column, quick buttons on each card (star, date, priority,
// delete), picking several cards to change together, sorting a column, a filter bar,
// a limit per column (WIP limit), rows per #project ("swimlanes") and folding a column.
// On phones it shows one column at a time, with tabs to switch (and to drop cards on).
//
// The dragging is done by dnd-kit (https://dndkit.com), which also works with the keyboard:
// Tab to a card, Space to pick it up, the arrow keys to move it, Space to drop it
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, closestCorners, pointerWithin, useDroppable } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "./Icon.jsx";
import { DueDate } from "./TaskItem.jsx";
import TaskComposer from "./TaskComposer.jsx";
import { AUTO_SCROLL, BOUNCE_MS, dropAnimation, useDragSensors } from "./dragFeel.js";
import { LIST_NAMES, TAG_PATTERN, findTags, plusDays, parseQuickAdd, recall, remember, tagColor, todayString } from "./tasks.js";
import { usePhone } from "./usePhone.js";

// Where a dragged card would land: whatever is under the POINTER (a card before its column,
// so you can drop between cards). The keyboard has no pointer: then the nearest place
function whereToDrop(args) {
  const underPointer = pointerWithin(args);
  if (underPointer.length === 0) {
    return closestCorners(args);
  }
  const isCard = (hit) => hit.data.droppableContainer.data.current.isCard === true;
  return [...underPointer.filter(isCard), ...underPointer.filter((hit) => !isCard(hit))];
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// The ways a column can be sorted. "mine" is your own order (the one you drag)
const SORTS = {
  mine: "My order",
  due: "Due date",
  priority: "Priority",
  newest: "Newest first"
};

function sortCards(cards, sort) {
  const sorted = [...cards];
  if (sort === "due") {
    // No date goes last ("9" sorts after every year)
    sorted.sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  } else if (sort === "priority") {
    sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  } else if (sort === "newest") {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  }
  return sorted;
}

// ---------- THE COLUMNS ----------
// Each column says which tasks it holds, what dropping a card on it changes, and what a task
// typed into its "+ Add a task" box starts with. accepts: false = you can't drop cards on it
function columnsFor(groupBy) {
  const today = todayString();
  const inAWeek = plusDays(today, 7);
  const done = { key: "done", label: "Done", accepts: true, holds: (task) => task.done && task.doneDate >= plusDays(today, -6), changes: () => ({}) };

  if (groupBy === "priority") {
    const priorities = ["high", "medium", "low"].map((priority) => ({
      key: priority,
      label: priority[0].toUpperCase() + priority.slice(1),
      accepts: true,
      holds: (task) => !task.done && task.priority === priority,
      changes: () => ({ priority }),
      starts: { priority }
    }));
    return [...priorities, done];
  }

  if (groupBy === "due") {
    // A card dropped on "Next 7 days" or "Later" keeps its date if it already fits there,
    // otherwise it gets the first day of that column (tomorrow, or 8 days from now)
    const tomorrow = plusDays(today, 1);
    const later = plusDays(today, 8);
    return [
      { key: "overdue", label: "Overdue", accepts: false, holds: (task) => !task.done && task.dueDate !== "" && task.dueDate < today },
      { key: "today", label: "Today", accepts: true, holds: (task) => !task.done && task.dueDate === today, changes: () => ({ dueDate: today }), starts: { dueDate: today } },
      {
        key: "week",
        label: "Next 7 days",
        accepts: true,
        holds: (task) => !task.done && task.dueDate > today && task.dueDate <= inAWeek,
        changes: (task) => (task.dueDate > today && task.dueDate <= inAWeek ? {} : { dueDate: tomorrow }),
        starts: { dueDate: tomorrow }
      },
      {
        key: "later",
        label: "Later",
        accepts: true,
        holds: (task) => !task.done && task.dueDate > inAWeek,
        changes: (task) => (task.dueDate > inAWeek ? {} : { dueDate: later }),
        starts: { dueDate: later }
      },
      { key: "none", label: "No date", accepts: true, holds: (task) => !task.done && task.dueDate === "", changes: () => ({ dueDate: "" }), starts: {} },
      done
    ];
  }

  // Lists (the default)
  const lists = Object.keys(LIST_NAMES).map((listKey) => ({
    key: listKey,
    label: LIST_NAMES[listKey],
    accepts: true,
    holds: (task) => !task.done && task.status === listKey,
    changes: () => ({ status: listKey }),
    starts: { status: listKey }
  }));
  return [...lists, done];
}

// ---------- ROWS PER #PROJECT ----------
// A task's row is its first #project ("" = the "No project" row)
function laneOf(task) {
  return findTags(task.text, "#")[0] || "";
}

// Move a task to another row by swapping its #project in the text:
// "Dig beds #garden" moved to the #home row becomes "Dig beds #home"
function swapProject(text, fromLane, toLane) {
  let newText = text;
  if (fromLane) {
    newText = newText.replace(new RegExp("(^|\\s)" + fromLane + "(?=\\s|$)", "iu"), " ");
  }
  if (toLane) {
    newText = newText + " " + toLane;
  }
  return newText.replace(/\s+/g, " ").trim();
}

// Board settings remembered in this browser, read SAFELY (damaged = start fresh)
function recallJson(key, empty) {
  try {
    return JSON.parse(recall(key)) || empty;
  } catch (error) {
    return empty;
  }
}

// Buttons inside a card: pressing them must not start a drag or open the card
const keepInside = {
  onPointerDown: (event) => event.stopPropagation(),
  onClick: (event) => event.stopPropagation(),
  onKeyDown: (event) => event.stopPropagation()
};

// ---------- ONE CARD ----------
// A task's name without its tags ("Dig beds #garden @home" → "Dig beds"), and the tags on
// their own: the card shows the tags in a row under the name, so every card lines up the same
function nameAndTags(text) {
  const tags = text.match(TAG_PATTERN) || [];
  const name = text.replace(TAG_PATTERN, " ").replace(/\s+/g, " ").trim();
  return { name: name || text, tags };
}

// What a card shows, in three rows that line up on every card:
//   tick box · name · star · ⋯       then its tags       then small facts (date, repeat...)
function CardFace({ task, onToggle, menu }) {
  const { name, tags } = nameAndTags(task.text);
  const stepsDone = task.steps.filter((step) => step.done).length;
  return (
    <>
      <div className="card-top">
        <input
          type="checkbox"
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          checked={task.done}
          onChange={(event) => onToggle && onToggle(task, event)}
          {...keepInside}
        />
        <span className={task.done ? "task-text card-name done" : "task-text card-name"}>{name}</span>
        {task.focus && <Icon name="star" className="card-star" />}
        {menu}
      </div>
      {tags.length > 0 && (
        <div className="card-tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag" style={{ "--tag-color": tagColor(tag) }}>{tag}</span>
          ))}
        </div>
      )}
      <div className="card-facts">
        {task.dueDate && <DueDate date={task.dueDate} />}
        {task.repeat && <small className="repeat-tag" title={"Repeats " + task.repeat}><Icon name="repeat" /></small>}
        {task.remindAt && !task.done && <small className="repeat-tag" title={"Reminder at " + task.remindAt}><Icon name="bell" />{task.remindAt}</small>}
        {task.steps.length > 0 && <small className="card-fact" title="Steps done"><Icon name="list-checks" />{stepsDone}/{task.steps.length}</small>}
        {task.notes && <small className="card-fact" title="Has notes"><Icon name="notes" /></small>}
      </div>
    </>
  );
}

// The ⋯ button on a card: a small menu of quick actions. It opens only when you click it
function CardMenu({ task, actions }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  // While it's open, a press anywhere else closes it
  useEffect(
    function () {
      if (!open) {
        return;
      }
      function pressedOutside(event) {
        if (box.current && !box.current.contains(event.target)) {
          setOpen(false);
        }
      }
      document.addEventListener("pointerdown", pressedOutside);
      return () => document.removeEventListener("pointerdown", pressedOutside);
    },
    [open]
  );

  // Do the action, then close the menu
  function act(action) {
    action();
    setOpen(false);
  }

  return (
    <div
      className="card-menu"
      ref={box}
      {...keepInside}
      onKeyDown={(event) => {
        event.stopPropagation();   // keys here are for the menu, not for dragging the card
        if (event.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <button type="button" className="card-more" title="More" aria-label={"More for " + task.text} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="more" />
      </button>
      {open && (
        <div className="card-menu-list" role="menu" aria-label={"More for " + task.text}>
          <button type="button" role="menuitem" onClick={() => act(() => actions.update(task.id, { focus: !task.focus }))}>
            <Icon name="star" /> {task.focus ? "Remove from Today" : "Add to Today"}
          </button>
          <label className="card-menu-date">
            <Icon name="calendar" /> Due
            <input type="date" value={task.dueDate} onChange={(event) => actions.update(task.id, { dueDate: event.target.value })} />
          </label>
          <div className="card-menu-priority" role="group" aria-label="Priority">
            {["high", "medium", "low"].map((priority) => (
              <button
                key={priority}
                type="button"
                role="menuitemradio"
                aria-checked={task.priority === priority}
                className={"priority-" + priority + (task.priority === priority ? " on" : "")}
                onClick={() => act(() => actions.update(task.id, { priority }))}
              >
                {priority[0].toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
          <button type="button" role="menuitem" onClick={() => act(() => actions.open(task.id))}>
            <Icon name="notes" /> Open
          </button>
          <button type="button" role="menuitem" className="danger" onClick={() => act(() => actions.remove(task.id))}>
            <Icon name="trash" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// A card you can drag. A click (or Enter) opens it; Ctrl/Shift-click (or X) picks it;
// Space picks it up for dragging
function Card({ task, cell, picked, riding, landed, selectMode, onOpen, onPick, actions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { cell, isCard: true } });
  let className = "board-card priority-" + task.priority;
  className += isDragging ? " slot" : "";
  className += task.done ? " is-done" : "";
  className += picked ? " picked" : "";
  className += riding ? " riding" : "";
  className += landed ? " just-dropped" : "";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={className}
      {...attributes}
      {...listeners}
      aria-label={task.text + (picked ? ", picked" : "") + ". Enter opens it, Space moves it, X picks it"}
      onClick={(event) => {
        if (selectMode || event.ctrlKey || event.metaKey || event.shiftKey) {
          onPick(task.id);
        } else {
          onOpen(task.id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onOpen(task.id);
          return;
        }
        if (event.key === "x" || event.key === "X") {
          onPick(task.id);
          return;
        }
        listeners.onKeyDown(event);
      }}
    >
      <CardFace task={task} onToggle={actions.toggleWithJoy} menu={<CardMenu task={task} actions={actions} />} />
    </li>
  );
}

// "+ Add a task": a quiet button that opens the add box (TaskComposer)
function QuickAdd({ onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="board-add" onClick={() => setOpen(true)}>
        + Add a task
      </button>
    );
  }
  return <TaskComposer label="New task" onAdd={onAdd} onClose={() => setOpen(false)} />;
}

// One cell: a column's cards (in one row, when rows per #project are on). It's a drop target
function Cell({ id, cell, isOver, children, cards }) {
  // (A column that takes no cards still counts as a place: the board then sends the card home)
  const { setNodeRef } = useDroppable({ id, data: { cell } });
  return (
    <SortableContext id={id} items={cards.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={isOver ? "board-cell over" : "board-cell"} data-column={cell.column} data-lane={cell.lane === null ? "*" : cell.lane}>
        {children}
      </div>
    </SortableContext>
  );
}

// A column's tab on phones: tap to show that column, or drop a card on it to move it there
function ColumnTab({ column, count, chosen, onChoose }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tab:" + column.key, data: { cell: { column: column.key } } });
  return (
    <button ref={setNodeRef} type="button" role="tab" aria-selected={chosen} className={"board-tab" + (chosen ? " chosen" : "") + (isOver && column.accepts ? " over" : "")} onClick={onChoose}>
      {column.label} <span className="count">{count}</span>
    </button>
  );
}

// ---------- THE BOARD ----------
// tasks: the tasks that fit the sidebar filter and search. actions: what the board may do
export default function Board({ tasks, actions }) {
  const isPhone = usePhone();
  const [groupBy, setGroupBy] = useState(() => recall("board-group") || "lists");
  const [lanesOn, setLanesOn] = useState(() => recall("board-lanes") === "true");
  const [limits, setLimits] = useState(() => recallJson("board-limits", {}));   // { "lists:next": 5 }
  const [folded, setFolded] = useState(() => recallJson("board-folded", []));   // ["lists:someday"]
  const [sorts, setSorts] = useState(() => recallJson("board-sort", {}));       // { "lists:next": "due" }
  const [editingLimit, setEditingLimit] = useState("");   // the column whose limit box is open
  const [sortMenu, setSortMenu] = useState("");           // the column whose sort menu is open
  const [phoneColumn, setPhoneColumn] = useState(0);      // which column a phone shows
  const [filters, setFilters] = useState({ high: false, week: false, reminder: false, project: "" });
  const [picked, setPicked] = useState([]);               // the cards picked to change together
  const [selectMode, setSelectMode] = useState(false);    // taps pick cards (handy on phones)
  const [activeId, setActiveId] = useState(null);         // the card being dragged
  const [dragFrom, setDragFromState] = useState(null);    // the cell it was picked up from
  // Also kept in a ref: while dragging, the card already "lives" in the cell it's over,
  // so the card itself can't tell where it came from any more
  const fromRef = useRef(null);
  function setDragFrom(value) {
    fromRef.current = value;
    setDragFromState(value);
  }
  const [plan, setPlanState] = useState(null);            // the cell it would land in: { column, lane }
  // The same plan in a ref too: the drop reads it at once, even before the page has redrawn
  const planRef = useRef(null);
  function setPlan(value) {
    planRef.current = value;
    setPlanState(value);
  }
  const [landed, setLanded] = useState([]);               // cards that just landed (they bounce)
  const swipeStart = useRef(null);

  const columns = columnsFor(groupBy);
  const shownColumns = isPhone ? [columns[Math.min(phoneColumn, columns.length - 1)]] : columns;
  const settingKey = (column) => groupBy + ":" + column.key;
  const sortOf = (column) => sorts[settingKey(column)] || "mine";

  // ---------- THE FILTER BAR ----------
  const inAWeek = plusDays(todayString(), 7);
  const shown = tasks.filter((task) => {
    if (filters.high && task.priority !== "high") return false;
    if (filters.week && !(task.dueDate !== "" && task.dueDate <= inAWeek)) return false;
    if (filters.reminder && task.remindAt === "") return false;
    if (filters.project && laneOf(task) !== filters.project && !findTags(task.text, "#").includes(filters.project)) return false;
    return true;
  });
  const projects = [];
  tasks.forEach((task) => {
    findTags(task.text, "#").forEach((tag) => {
      if (!projects.includes(tag)) {
        projects.push(tag);
      }
    });
  });
  projects.sort();
  const anyFilter = filters.high || filters.week || filters.reminder || filters.project !== "";

  // The rows: one per #project used (sorted), then "No project". Off: one row for everything
  let lanes = [null];
  if (lanesOn) {
    const used = [];
    shown.forEach((task) => {
      const lane = laneOf(task);
      if (lane && !used.includes(lane)) {
        used.push(lane);
      }
    });
    lanes = [...used.sort(), ""];
  }

  const activeTask = tasks.find((task) => task.id === activeId);
  const inColumn = (column) => shown.filter(column.holds);

  // The cards of one cell, in the order shown. While a card is dragged to another column,
  // it's moved there already (as an empty slot), so the cards there make room for it
  function cardsIn(column, lane) {
    let cards = sortCards(inColumn(column).filter((task) => lane === null || laneOf(task) === lane), sortOf(column));
    const elsewhere = plan && dragFrom && (plan.column !== dragFrom.column || plan.lane !== dragFrom.lane);
    if (activeTask && elsewhere) {
      cards = cards.filter((task) => task.id !== activeId);
      if (plan.column === column.key && (lane === null || plan.lane === lane)) {
        cards = [...cards, activeTask];   // at the end for now; the drop puts it in its place
      }
    }
    return cards;
  }
  const cellId = (column, lane) => "cell:" + column.key + "|" + (lane === null ? "*" : lane);

  // ---------- SETTINGS ----------
  function chooseGroup(value) {
    setGroupBy(value);
    setPhoneColumn(0);
    remember("board-group", value);
  }

  function toggleLanes() {
    setLanesOn(!lanesOn);
    remember("board-lanes", !lanesOn);
  }

  function saveLimit(column, text) {
    const number = parseInt(text, 10);
    const newLimits = { ...limits };
    if (number > 0) {
      newLimits[settingKey(column)] = number;
    } else {
      delete newLimits[settingKey(column)];   // 0 or empty: no limit
    }
    setLimits(newLimits);
    remember("board-limits", JSON.stringify(newLimits));
    setEditingLimit("");
  }

  function toggleFold(column) {
    const key = settingKey(column);
    const newFolded = folded.includes(key) ? folded.filter((other) => other !== key) : [...folded, key];
    setFolded(newFolded);
    remember("board-folded", JSON.stringify(newFolded));
  }

  function chooseSort(column, sort) {
    const newSorts = { ...sorts, [settingKey(column)]: sort };
    setSorts(newSorts);
    remember("board-sort", JSON.stringify(newSorts));
    setSortMenu("");
  }

  function toggleFilter(name) {
    setFilters({ ...filters, [name]: !filters[name] });
  }

  // Too many cards in a column: the dog says so (a fact, not a telling-off)
  function checkLimit(column, newCount) {
    const limit = limits[settingKey(column)];
    if (limit && newCount > limit) {
      actions.say(column.label + " has " + newCount + " tasks now. Its limit is " + limit);
    }
  }

  // ---------- PICKING SEVERAL CARDS ----------
  function pick(id) {
    // (from the newest list: two quick clicks in a row both count)
    setPicked((old) => (old.includes(id) ? old.filter((other) => other !== id) : [...old, id]));
  }

  function clearPicked() {
    setPicked([]);
    setSelectMode(false);
  }

  const pickedTasks = tasks.filter((task) => picked.includes(task.id));

  function moveAllTo(columnKey) {
    const column = columns.find((column) => column.key === columnKey);
    pickedTasks.forEach((task) => moveToCell(task, column, laneOf(task), lanesOn ? laneOf(task) : null, false));
    actions.say("Moved " + pickedTasks.length + (pickedTasks.length === 1 ? " task" : " tasks") + " to " + column.label);
    clearPicked();
  }

  function changeAll(changes, message) {
    pickedTasks.forEach((task) => actions.update(task.id, changes));
    actions.say(message);
  }

  function tickAll() {
    pickedTasks.filter((task) => !task.done).forEach((task) => actions.complete(task.id));
    clearPicked();
  }

  function deleteAll() {
    pickedTasks.forEach((task) => actions.remove(task.id));
    actions.say("Deleted " + pickedTasks.length + (pickedTasks.length === 1 ? " task" : " tasks"));
    clearPicked();
  }

  // ---------- ADDING AND MOVING ----------
  function addTo(column, lane, typed) {
    const quick = parseQuickAdd(typed);
    if (quick.text === "") {
      return;
    }
    const text = lane ? quick.text + " " + lane : quick.text;
    // What the column says wins; anything typed (!high, tomorrow...) fills in the rest
    actions.add(text, { dueDate: quick.dueDate, priority: quick.priority, repeat: quick.repeat, remindAt: quick.remindAt, ...column.starts });
    checkLimit(column, inColumn(column).length + 1);
  }

  // A card dropped into another column (and/or row): change what that column means
  function moveToCell(task, column, fromLane, toLane, warn = true) {
    const wasThere = column.holds(task);
    if (column.key === "done" && !task.done) {
      actions.complete(task.id);
    }
    if (column.key !== "done" && task.done) {
      actions.toggle(task.id);   // dragged out of Done: not done any more
    }
    const changes = column.key === "done" ? {} : column.changes(task);
    if (lanesOn && toLane !== null && fromLane !== toLane) {
      changes.text = swapProject(task.text, fromLane, toLane);
    }
    if (Object.keys(changes).length > 0) {
      actions.update(task.id, changes);
    }
    if (warn && !wasThere && column.key !== "done") {
      checkLimit(column, inColumn(column).length + 1);
    }
  }

  // A small bounce for cards that have just landed
  function bounce(ids) {
    setLanded(ids);
    setTimeout(() => setLanded([]), BOUNCE_MS);
  }

  // ---------- DRAGGING ----------
  function dragStarted({ active }) {
    setActiveId(active.id);
    setDragFrom(active.data.current.cell);
    setPlan(active.data.current.cell);
    setSortMenu("");
  }

  // The card moved over another cell (or a phone tab): move its slot there
  function draggedOver({ over }) {
    const cell = over && over.data.current && over.data.current.cell;
    if (!cell) {
      return;
    }
    const column = columns.find((column) => column.key === cell.column);
    if (!column || !column.accepts) {
      // You can't drop here (e.g. Overdue): the slot goes back home, so letting go puts it back
      setPlan(fromRef.current);
      return;
    }
    const current = planRef.current;
    const lane = cell.lane === undefined ? (current ? current.lane : fromRef.current.lane) : cell.lane;
    if (!current || current.column !== cell.column || current.lane !== lane) {
      setPlan({ column: cell.column, lane });
    }
  }

  function dragCancelled() {
    setActiveId(null);
    setDragFrom(null);
    setPlan(null);
  }

  function dropped({ active, over }) {
    const task = tasks.find((task) => task.id === active.id);
    const from = fromRef.current;
    const to = planRef.current;
    setActiveId(null);
    setDragFrom(null);
    setPlan(null);
    if (!task || !to || !over) {
      return;
    }
    const column = columns.find((column) => column.key === to.column);
    const toLane = to.lane;
    const moved = from.column !== to.column || from.lane !== toLane;
    const riders = picked.includes(task.id) ? pickedTasks.filter((other) => other.id !== task.id) : [];
    if (moved) {
      moveToCell(task, column, from.lane, toLane);
      riders.forEach((rider) => moveToCell(rider, column, laneOf(rider), lanesOn ? toLane : null, false));
    }

    // The order: where it is among the cards of its new cell (only in "My order")
    if (sortOf(column) === "mine") {
      let cards = sortCards(inColumn(column).filter((other) => toLane === null || laneOf(other) === toLane), "mine").filter((other) => other.id !== task.id);
      const overIndex = cards.findIndex((other) => other.id === over.id);
      let index = cards.length;   // dropped on empty space: at the end
      if (overIndex !== -1) {
        const myIndex = moved ? -1 : sortCards(inColumn(column).filter((other) => toLane === null || laneOf(other) === toLane), "mine").findIndex((other) => other.id === task.id);
        index = myIndex !== -1 && myIndex <= overIndex ? overIndex + 1 : overIndex;   // moving down: after it
      }
      cards = [...cards.slice(0, index), task, ...cards.slice(index)];
      const place = cards.indexOf(task);
      if (cards[place + 1]) {
        actions.move(task.id, cards[place + 1].id, false);
      } else if (cards[place - 1]) {
        actions.move(task.id, cards[place - 1].id, true);
      }
      riders.forEach((rider, n) => actions.move(rider.id, n === 0 ? task.id : riders[n - 1].id, true));
    }
    bounce([task.id, ...riders.map((rider) => rider.id)]);
    if (riders.length > 0) {
      clearPicked();
    }
  }

  // ---------- THE WORDS FOR SCREEN READERS (instead of dnd-kit's card ids) ----------
  const nameOf = (id) => (tasks.find((task) => task.id === id) || { text: "card" }).text;
  const columnName = (over) => {
    const cell = over && over.data.current && over.data.current.cell;
    const column = cell && columns.find((column) => column.key === cell.column);
    return column ? column.label : "nowhere";
  };
  const accessibility = {
    screenReaderInstructions: { draggable: "To move a card, press Space, use the arrow keys, then Space again to drop it. Escape cancels. Enter opens the card. X picks it, to change several cards together." },
    announcements: {
      onDragStart: ({ active }) => "Picked up " + nameOf(active.id),
      onDragOver: ({ active, over }) => nameOf(active.id) + " is over " + columnName(over),
      onDragEnd: ({ active, over }) => (over ? "Dropped " + nameOf(active.id) + " in " + columnName(over) : "Dropped " + nameOf(active.id)),
      onDragCancel: ({ active }) => "Stopped moving " + nameOf(active.id)
    }
  };

  const sensors = useDragSensors(sortableKeyboardCoordinates);

  // Phones: a sideways swipe on the column shows the next or previous one
  function swipeEnded(event) {
    if (swipeStart.current === null || activeId) {
      return;
    }
    const distance = event.changedTouches[0].clientX - swipeStart.current;
    if (Math.abs(distance) > 60) {
      setPhoneColumn(Math.max(0, Math.min(columns.length - 1, phoneColumn + (distance < 0 ? 1 : -1))));
    }
    swipeStart.current = null;
  }

  const gridColumns = shownColumns.map((column) => (!isPhone && folded.includes(settingKey(column)) ? "44px" : "minmax(220px, 1fr)")).join(" ");
  const riding = activeId && picked.includes(activeId) ? picked.filter((id) => id !== activeId) : [];

  return (
    <section className="board" aria-label="Board">
      <div className="board-bar">
        <label className="board-group">
          Group by
          <select value={groupBy} onChange={(event) => chooseGroup(event.target.value)}>
            <option value="lists">Lists</option>
            <option value="priority">Priority</option>
            <option value="due">Due date</option>
          </select>
        </label>
        <div className="board-bar-right">
          <button type="button" className={selectMode ? "board-chip on" : "board-chip"} aria-pressed={selectMode} onClick={() => (selectMode ? clearPicked() : setSelectMode(true))}>
            <Icon name="list-checks" /> {selectMode ? "Done picking" : "Select"}
          </button>
          <label className="rewards-switch board-lanes-switch">
            <input type="checkbox" checked={lanesOn} onChange={toggleLanes} />
            Rows per #project
          </label>
        </div>
      </div>

      {/* THE FILTER BAR: show only some cards, without touching the sidebar */}
      <div className="board-filters" role="group" aria-label="Show only">
        <button type="button" className={filters.high ? "board-chip on" : "board-chip"} aria-pressed={filters.high} onClick={() => toggleFilter("high")}>High priority</button>
        <button type="button" className={filters.week ? "board-chip on" : "board-chip"} aria-pressed={filters.week} onClick={() => toggleFilter("week")}>Due this week</button>
        <button type="button" className={filters.reminder ? "board-chip on" : "board-chip"} aria-pressed={filters.reminder} onClick={() => toggleFilter("reminder")}><Icon name="bell" /> Has reminder</button>
        {projects.map((tag) => (
          <button key={tag} type="button" className={filters.project === tag ? "board-chip on" : "board-chip"} aria-pressed={filters.project === tag} onClick={() => setFilters({ ...filters, project: filters.project === tag ? "" : tag })}>
            {tag}
          </button>
        ))}
        {anyFilter && (
          <button type="button" className="link-button board-clear" onClick={() => setFilters({ high: false, week: false, reminder: false, project: "" })}>
            Show all
          </button>
        )}
      </div>

      {/* THE PICKED-CARDS BAR: change them all at once */}
      {picked.length > 0 && (
        <div className="bulk-bar" role="toolbar" aria-label="Change the picked cards">
          <strong>{picked.length} picked</strong>
          <select aria-label="Move to" value="" onChange={(event) => event.target.value && moveAllTo(event.target.value)}>
            <option value="">Move to…</option>
            {columns.filter((column) => column.accepts).map((column) => (
              <option key={column.key} value={column.key}>{column.label}</option>
            ))}
          </select>
          <select aria-label="Set priority" value="" onChange={(event) => event.target.value && changeAll({ priority: event.target.value }, "Priority changed")}>
            <option value="">Priority…</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label className="bulk-date">
            Due
            <input type="date" aria-label="Set the due date" onChange={(event) => changeAll({ dueDate: event.target.value }, event.target.value ? "Due date set" : "Due date taken away")} />
          </label>
          <button type="button" onClick={tickAll}><Icon name="check" /> Tick</button>
          <button type="button" onClick={deleteAll}><Icon name="trash" /> Delete</button>
          <button type="button" className="bulk-clear" onClick={clearPicked}>Clear</button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={whereToDrop}
        autoScroll={AUTO_SCROLL}
        accessibility={accessibility}
        onDragStart={dragStarted}
        onDragOver={draggedOver}
        onDragEnd={dropped}
        onDragCancel={dragCancelled}
      >
        {/* Phones: the column tabs (also drop targets) */}
        {isPhone && (
          <div className="board-tabs" role="tablist" aria-label="Columns">
            {columns.map((column, index) => (
              <ColumnTab key={column.key} column={column} count={inColumn(column).length} chosen={index === phoneColumn} onChoose={() => setPhoneColumn(index)} />
            ))}
          </div>
        )}

        <div
          className={activeId ? "board-grid dragging" : "board-grid"}
          style={{ gridTemplateColumns: gridColumns }}
          onTouchStart={(event) => (swipeStart.current = event.touches[0].clientX)}
          onTouchEnd={swipeEnded}
        >
          {/* The column headers */}
          {shownColumns.map((column) => {
            const count = inColumn(column).length;
            const limit = limits[settingKey(column)];
            const isFolded = !isPhone && folded.includes(settingKey(column));
            const sort = sortOf(column);
            return (
              <div key={column.key} data-column={column.key} className={"board-head" + (limit && count > limit ? " over-limit" : "") + (isFolded ? " folded" : "")}>
                <button type="button" className="board-fold" aria-expanded={!isFolded} title={isFolded ? "Unfold " + column.label : "Fold " + column.label} onClick={() => toggleFold(column)}>
                  <span className="board-title">{column.label}</span>
                  {!isFolded && sort !== "mine" && <small className="sort-note">{SORTS[sort]}</small>}
                </button>
                {!isFolded && (
                  <>
                    <button type="button" className="sort-button" aria-label={"Sort " + column.label} aria-expanded={sortMenu === column.key} title="Sort this column" onClick={() => setSortMenu(sortMenu === column.key ? "" : column.key)}>
                      <Icon name="arrow-up-down" />
                    </button>
                    {editingLimit === column.key ? (
                      <input
                        type="number"
                        min="0"
                        className="limit-input"
                        aria-label={"Limit for " + column.label + " (0 = none)"}
                        defaultValue={limit || ""}
                        autoFocus
                        onBlur={(event) => saveLimit(column, event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && saveLimit(column, event.target.value)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="limit-button"
                        title={column.key === "done" ? "Finished in the last 7 days" : "Set a limit for this column"}
                        disabled={column.key === "done"}
                        onClick={() => setEditingLimit(column.key)}
                      >
                        {limit ? count + " / " + limit : count}
                      </button>
                    )}
                  </>
                )}
                {isFolded && <span className="count">{count}</span>}
                {sortMenu === column.key && (
                  <div className="sort-menu" role="menu" aria-label={"Sort " + column.label}>
                    {Object.keys(SORTS).map((key) => (
                      <button key={key} type="button" role="menuitemradio" aria-checked={sort === key} className={sort === key ? "on" : ""} onClick={() => chooseSort(column, key)}>
                        {SORTS[key]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* The rows (one, or one per #project), each with a cell per column */}
          {lanes.map((lane) => (
            <div key={lane === null ? "all" : lane || "none"} className="board-row" style={{ gridColumn: "1 / -1", gridTemplateColumns: gridColumns }}>
              {lane !== null && <p className="lane-title">{lane || "No project"}</p>}
              {shownColumns.map((column) => {
                const isFolded = !isPhone && folded.includes(settingKey(column));
                if (isFolded) {
                  return <div key={column.key} className="board-cell folded" aria-hidden="true"></div>;
                }
                const cards = cardsIn(column, lane);
                const isOver = plan && activeId && plan.column === column.key && (lane === null || plan.lane === lane);
                return (
                  <Cell key={column.key} id={cellId(column, lane)} cell={{ column: column.key, lane }} isOver={isOver} cards={cards}>
                    <ul className="board-cards">
                      {cards.map((task) => (
                        <Card
                          key={task.id}
                          task={task}
                          cell={{ column: column.key, lane }}
                          picked={picked.includes(task.id)}
                          riding={riding.includes(task.id)}
                          landed={landed.includes(task.id)}
                          selectMode={selectMode}
                          onOpen={actions.open}
                          onPick={pick}
                          actions={actions}
                        />
                      ))}
                    </ul>
                    {cards.length === 0 && !column.starts && <p className="board-empty">Nothing here</p>}
                    {column.starts && <QuickAdd onAdd={(text) => addTo(column, lane, text)} />}
                  </Cell>
                );
              })}
            </div>
          ))}
        </div>

        {/* The lifted card that follows the pointer. It's drawn straight into the page's body
            (a "portal"), so nothing it sits inside can shift it away from the pointer */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation()}>
            {activeTask && (
              <div className={"board-card lifted priority-" + activeTask.priority}>
                <CardFace task={activeTask} />
                {riding.length > 0 && <span className="stack-count">+{riding.length}</span>}
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </section>
  );
}
