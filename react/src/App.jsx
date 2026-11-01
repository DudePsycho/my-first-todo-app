// THE APP: holds the app's memory (tasks, filter, search, dark mode, menu, the dog)
// and describes the whole page from it.
//
// The plain version had functions like applyFilter() and updateCounter() that you had to
// remember to call after every change. Here there are none: every time the memory changes,
// React runs App() again, and the counts, filters and lists are simply worked out fresh
import { useEffect, useRef, useState } from "react";
import { useTasks } from "./useTasks.js";
import { LIST_NAMES, LIST_FILTERS, REPEAT_NAMES, findTags, cleanTask, parseQuickAdd, suggestDateWord, todayString, dateString, nextDueDate } from "./tasks.js";
import Sidebar from "./Sidebar.jsx";
import TaskItem, { TaskText, StepList } from "./TaskItem.jsx";
import Lhasa from "./Lhasa.jsx";
import Coach from "./Coach.jsx";
import Dog from "./Dog.jsx";
import Icon from "./Icon.jsx";

// The ink strip at the top: things we say to dogs, turned into to-do tips
// The tricks the Lhasa Apso teaches, one at a time (tap it for the next)
const TRICKS = [
  "New tasks land in your Inbox. Sort them later",
  "Add #garden to group tasks into a project",
  "Add @home to say where you can do it",
  "Add !high, !medium or !low to set the priority",
  "Add today, tomorrow or a day like friday to set a date",
  "Type the start of a day, like fri, and press Tab to finish it"
];

const DOG_COMMANDS = [
  "fetch the next task",
  "sit. stay. focus.",
  "drop it: not everything is yours to do",
  "leave it: that’s a someday idea",
  "heel: one step at a time",
  "roll over: move it to tomorrow",
  "shake on it: done is done",
  "speak: write it down before you forget",
  "go find it: search your tasks",
  "sniff out the very next step",
  "dig in: start with the hardest one",
  "bury it in Someday",
  "who’s waiting? check your Waiting list",
  "play dead: phone off for 25 minutes",
  "walkies after this one",
  "paws for a stretch",
  "catch: grab ideas the moment they fly by",
  "bring it back: weekly review time"
];

// Shuffle a list into a random order (a new copy; the original stays as it is).
// Each place swaps with a random place before it: the "Fisher-Yates shuffle"
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];   // swap the two
  }
  return copy;
}

// "1 task" or "3 tasks": the right word for the number
function plural(count, word) {
  return count + " " + word + (count === 1 ? "" : "s");
}

// Settings (dark mode, the menu) are nice to remember, but not worth crashing over:
// if the browser's storage is full or blocked, they just aren't remembered
function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // not remembered this time: that's fine
  }
}

function recall(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

// A due date for people: "2026-11-06" becomes "Fri 6 Nov"
function shortDay(date) {
  return new Date(date + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// What the dog says when you pet it: something useful about your tasks right now.
// It collects every tip that's true at the moment, and picks one of them
function dogTip(todo, done) {
  const today = todayString();
  const overdue = todo.filter((task) => task.dueDate !== "" && task.dueDate < today).length;
  const dueToday = todo.filter((task) => task.dueDate === today).length;
  const inbox = todo.filter((task) => task.status === "inbox").length;
  const starred = todo.filter((task) => task.focus).length;

  if (todo.length === 0 && done.length === 0) {
    return "No tasks yet. Type one in the box above";
  }
  if (todo.length === 0) {
    return "Everything is done. Add a new task when you're ready";
  }

  const tips = [];
  if (overdue > 0) {
    tips.push(plural(overdue, "task") + " overdue. Do it, move the date, or delete it");
  }
  if (dueToday > 0) {
    tips.push(plural(dueToday, "task") + " due today");
  }
  if (inbox > 0) {
    tips.push(plural(inbox, "task") + " in your inbox. Use Sort inbox to decide what each one is");
  }
  if (starred === 0) {
    tips.push("Nothing on Today yet. Star the tasks you'll do today");
  }
  tips.push(done.length + " of " + (todo.length + done.length) + " tasks done");

  return tips[Math.floor(Math.random() * tips.length)];
}

// True on phone-sized screens
function isPhone() {
  return window.matchMedia("(max-width: 760px)").matches;
}

// Count the UNFINISHED tasks for each tag of one kind, sorted by name:
// [{ tag: "#garden", count: 2 }, { tag: "#trip", count: 1 }]
function countTags(todo, symbol) {
  const counts = {};
  todo.forEach((task) => {
    findTags(task.text, symbol).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.keys(counts).sort().map((tag) => ({ tag, count: counts[tag] }));
}

// The "nothing here" message for the chosen filter
function emptyMessage(search, filter) {
  if (search.trim() !== "") {
    return "No tasks contain \"" + search.trim() + "\"";
  }
  const messages = {
    inbox: "Your inbox is empty. New tasks land here",
    focus: "Nothing on Today. Star a task to add it here",
    next: "No next steps. Sort your inbox to find some",
    waiting: "You're not waiting on anyone",
    someday: "No someday ideas yet",
    overdue: "Nothing overdue",
    today: "Nothing due today",
    upcoming: "Nothing due in the next 7 days"
  };
  return messages[filter] || "No tasks match this filter";
}

// The "Deleted ‘…’ Undo" bar at the bottom. It's a "popover", which the browser always
// draws on top of everything, even the dog coach's pop-up (older browsers show a normal bar)
function UndoBar({ text, onUndo }) {
  const bar = useRef(null);
  useEffect(function () {
    if (bar.current.showPopover) {
      bar.current.showPopover();
    }
  }, []);
  return (
    <div className="undo-bar" popover="manual" ref={bar} role="status">
      <span className="undo-text">Deleted ‘<span className="undo-name">{text}</span>’</span>
      <button className="undo-button" onClick={onUndo}>Undo</button>
    </div>
  );
}

export default function App() {
  const { tasks, storageProblem, addTask, updateTask, toggleDone, deleteTask, restoreTask, addTasks } = useTasks();

  // ---------- MEMORY: everything that can change on the page ----------
  const [newText, setNewText] = useState("");             // the "What's on your mind?" box
  const [newDate, setNewDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newRepeat, setNewRepeat] = useState("");
  const [newNotes, setNewNotes] = useState("");           // notes for the task being written
  const [newNotesOpen, setNewNotesOpen] = useState(false);
  const [newSteps, setNewSteps] = useState([]);           // steps for the task being written
  const [newStepsOpen, setNewStepsOpen] = useState(false);
  const [filter, setFilter] = useState("all");            // "all", "inbox", "#garden"...
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(() => recall("darkMode") === "true");
  // Menu: shrunk on phones, otherwise the way you left it (open the first time)
  const [menuOpen, setMenuOpen] = useState(() => !isPhone() && recall("menuOpen") !== "false");
  const [coach, setCoach] = useState(null);               // null (closed), or { mode: "sort" | "review", key }

  // The dog: its speech bubble, its hop, and the running dogs and paw prints on screen
  const [bubble, setBubble] = useState({ text: "", show: false });
  const [runners, setRunners] = useState([]);
  const [paws, setPaws] = useState([]);
  const bubbleTimer = useRef();   // useRef: memory that does NOT redraw the page when it changes

  // UNDO: the last deleted task and where it was, for 10 seconds (null = nothing to undo)
  const [undo, setUndo] = useState(null);
  const undoTimer = useRef();

  // The strip's commands, shuffled once when the app opens (so every visit reads differently,
  // but they don't jump around while you use the app)
  const [commands] = useState(() => shuffle(DOG_COMMANDS).join(" ✦ ") + " ✦ ");

  // Which trick the Lhasa is showing (0 = the first). Starts at the first one every visit
  const [trick, setTrick] = useState(0);

  // ---------- SIDE EFFECTS: things outside our page box that must follow the memory ----------

  // Dark mode lives on <html>, outside React's box, so we set it by hand (and remember it)
  useEffect(
    function () {
      if (isDark) {
        document.documentElement.dataset.theme = "dark";
      } else {
        delete document.documentElement.dataset.theme;
      }
      // Phones color their browser bar with this: match the page (--night-paper or --paper)
      document.querySelector('meta[name="theme-color"]').content = isDark ? "#131313" : "#f7f7f5";
      remember("darkMode", isDark);
    },
    [isDark]
  );

  // When the screen becomes phone-sized (a phone turned upright, a window made narrow),
  // shrink the menu, so the open menu doesn't suddenly cover the tasks.
  // The [] means: set this up once. The function it returns cleans up if App ever goes away
  useEffect(function () {
    const phoneScreen = window.matchMedia("(max-width: 760px)");
    function screenChanged() {
      if (phoneScreen.matches) {
        setMenuOpen(false);
      }
    }
    phoneScreen.addEventListener("change", screenChanged);
    return () => phoneScreen.removeEventListener("change", screenChanged);
  }, []);

  // Remember the menu choice on bigger screens (phones always start with the menu shrunk)
  useEffect(
    function () {
      if (!isPhone()) {
        remember("menuOpen", menuOpen);
      }
    },
    [menuOpen]
  );

  // ---------- WORKED OUT FRESH ON EVERY DRAW (no updateCounter needed) ----------
  const todo = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  // The date views. Each one answers "does this due date belong here?"
  // Dates are "YYYY-MM-DD" text, so < and > compare them like real dates
  const todayDate = todayString();
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const inAWeek = dateString(weekAhead);
  const dateViews = {
    overdue: (date) => date !== "" && date < todayDate,   // "" (no date) would count as "earlier"
    today: (date) => date === todayDate,
    upcoming: (date) => date > todayDate && date <= inAWeek
  };

  const counts = {
    all: tasks.length,
    active: todo.length,
    done: done.length,
    focus: todo.filter((task) => task.focus).length
  };
  ["high", "medium", "low"].forEach((priority) => {
    counts[priority] = tasks.filter((task) => task.priority === priority).length;
  });
  Object.keys(LIST_NAMES).forEach((listKey) => {
    counts[listKey] = todo.filter((task) => task.status === listKey).length;
  });
  Object.keys(dateViews).forEach((view) => {
    counts[view] = todo.filter((task) => dateViews[view](task.dueDate)).length;
  });

  const projects = countTags(todo, "#");
  const contexts = countTags(todo, "@");
  const isTagFilter = filter[0] === "#" || filter[0] === "@";

  // If the chosen tag no longer exists (e.g. its last task was finished), go back to "All"
  const tagStillExists = projects.concat(contexts).some(({ tag }) => tag === filter);
  useEffect(
    function () {
      if (isTagFilter && !tagStillExists) {
        setFilter("all");
      }
    },
    [isTagFilter, tagStillExists]
  );

  // Does one task fit the chosen filter AND the search?
  const searchWord = search.trim().toLowerCase();
  function isVisible(task) {
    // Search looks in the task text, its notes and its steps
    const allText = [task.text, task.notes].concat(task.steps.map((step) => step.text)).join(" ");
    if (!allText.toLowerCase().includes(searchWord)) {
      return false;
    }
    if (filter === "high" || filter === "medium" || filter === "low") {
      return task.priority === filter;
    }
    if (filter === "focus") {
      return !task.done && task.focus;
    }
    if (LIST_FILTERS.includes(filter)) {
      return !task.done && task.status === filter;
    }
    if (dateViews[filter]) {
      return !task.done && dateViews[filter](task.dueDate);
    }
    if (isTagFilter) {
      return findTags(task.text, filter[0]).includes(filter);
    }
    return true;   // "all", "active" and "done" show every task (the sections do the rest)
  }

  const visibleTodo = todo.filter(isVisible);
  const visibleDone = done.filter(isVisible);
  // In a date view, the earliest date goes on top
  if (dateViews[filter]) {
    visibleTodo.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  // Which sections to show. When searching or using a narrow filter, hide an empty section
  const isNarrowed = searchWord !== "" || !["all", "active", "done"].includes(filter);
  let showTodo = filter !== "done";
  let showDone = filter !== "active" && !LIST_FILTERS.includes(filter) && !dateViews[filter];
  if (isNarrowed) {
    showTodo = showTodo && visibleTodo.length > 0;
    showDone = showDone && visibleDone.length > 0;
  }
  const showNoResults = isNarrowed && !showTodo && !showDone;

  // ---------- THE DOG ----------
  // The dog talks for 2.2 seconds (longer for important news, e.g. dogSays("...", 8000))
  function dogSays(message, howLong = 2200) {
    setBubble({ text: message, show: true });
    // If the dog was already talking, restart the countdown
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble((old) => ({ ...old, show: false })), howLong);
  }

  // Saving trouble (see useTasks): the dog says so, for 8 seconds, every time it happens
  useEffect(
    function () {
      const messages = {
        damaged: "Your saved tasks couldn’t be read. A copy is kept safe in this browser",
        locked: "Your saved tasks couldn’t be read, so nothing will be saved over them",
        "save-failed": "Couldn’t save. Download a backup"
      };
      if (storageProblem) {
        dogSays(messages[storageProblem.kind], 8000);
      }
    },
    [storageProblem]
  );

  // A dog runs across the bottom of the screen. Each runner is a little note in memory,
  // drawn at the bottom of the page and crossed off after 2.8 seconds
  function runDog() {
    const id = Date.now() + Math.random();
    setRunners((old) => [...old, id]);
    setTimeout(() => setRunners((old) => old.filter((runner) => runner !== id)), 2800);
  }

  // 3 little paws walk away from the spot (x, y), zig-zagging like real steps
  function pawPrints(x, y) {
    const newPaws = [0, 1, 2].map((step) => ({
      id: Date.now() + Math.random(),
      left: x + 24 + step * 24,
      top: y + (step % 2 === 0 ? -6 : 6),
      delay: step * 120
    }));
    setPaws((old) => [...old, ...newPaws]);
    setTimeout(() => setPaws((old) => old.filter((paw) => !newPaws.includes(paw))), 1200);
  }

  // Finishing a task: the dog runs, and says how many are left
  function celebrate(task) {
    runDog();
    if (task.repeat) {
      dogSays("Done. Next one due " + shortDay(nextDueDate(task)));
      return;
    }
    const left = todo.length - 1;   // the task being finished is still in todo
    dogSays(left === 0 ? "Done. Nothing left to do" : "Done. " + plural(left, "task") + " left");
  }

  // ---------- WHAT HAPPENS WHEN YOU CLICK THINGS ----------
  // ---------- SMART QUICK ADD (worked out fresh on every key you type) ----------
  const quick = parseQuickAdd(newText);           // the text, plus a typed priority and date
  const suggestion = suggestDateWord(newText);    // e.g. "day" while you type "sun"
  const suggestedWord = suggestion ? (newText.split(" ").pop() + suggestion).toLowerCase() : "";

  // The preview under the box: "Due Fri 6 Nov · High priority · Repeats weekly"
  const found = [];
  if (quick.dueDate) {
    found.push("Due " + shortDay(quick.dueDate));
  }
  if (quick.priority) {
    found.push(quick.priority[0].toUpperCase() + quick.priority.slice(1) + " priority");
  }
  if (quick.repeat) {
    found.push("Repeats " + quick.repeat);
  }

  // Finish the word you started: "sun" becomes "sunday"
  function completeWord() {
    setNewText(newText + suggestion);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleAdd();
    }
    if (event.key === "Tab" && suggestion) {
      event.preventDefault();   // Tab normally jumps to the next button: not now
      completeWord();
    }
  }

  function handleAdd() {
    if (quick.text === "") {
      return;   // nothing left to add (e.g. only "!high" was typed)
    }
    // Typed extras win; otherwise use the date picker and the dropdown
    addTask(quick.text, quick.dueDate || newDate, quick.priority || newPriority, "inbox", quick.repeat || newRepeat, newNotes, newSteps);
    dogSays("Added to Inbox. " + plural(counts.inbox + 1, "task") + " to sort");
    setNewText("");
    setNewDate("");
    setNewRepeat("");
    setNewNotes("");
    setNewSteps([]);
    setNewNotesOpen(false);
    setNewStepsOpen(false);
  }

  function handleToggle(task, event) {
    toggleDone(task.id);
    if (!task.done) {
      // It's being ticked: paw prints walk away from the checkbox
      const spot = event.target.getBoundingClientRect();
      pawPrints(spot.left + spot.width / 2, spot.top + spot.height / 2);
      celebrate(task);
    }
  }

  function handleStar(task) {
    updateTask(task.id, { focus: !task.focus });
    if (task.focus) {
      dogSays("Removed from Today");
    } else if (task.done) {
      dogSays("Starred");   // finished tasks don't count for Today
    } else {
      dogSays("Added to Today. " + (counts.focus + 1) + " starred");
    }
  }

  function handleMove(task, listKey) {
    updateTask(task.id, { status: listKey });
    dogSays("Moved to " + LIST_NAMES[listKey]);
  }

  function chooseFilter(value) {
    setFilter(value);
    // On a phone, the open menu covers the tasks: close it so you can see what you picked
    if (isPhone()) {
      setMenuOpen(false);
    }
  }

  // ---------- BACKUP & RESTORE 💾 ----------
  function downloadTasks() {
    if (tasks.length === 0) {
      dogSays("Nothing to back up yet");
      return;
    }
    // The backup is made from the tasks on screen (not from what's saved), so it's complete
    // even when the browser couldn't save. JSON.stringify(..., null, 2) makes it readable
    const fileText = JSON.stringify(tasks, null, 2);
    // A Blob is a file made inside the browser. A hidden link downloads it
    const file = new Blob([fileText], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "my-tasks-" + todayString() + ".json";
    link.click();
    URL.revokeObjectURL(link.href);
    dogSays("Backup saved: " + plural(tasks.length, "task") + ". Keep the file somewhere safe");
  }

  // Add the tasks from a backup file (MERGE): skip broken tasks and ones we already have
  async function restoreFile(file) {
    let fileTasks;
    try {
      fileTasks = JSON.parse(await file.text());   // await: wait for the file to be read
    } catch (error) {
      dogSays("Couldn't read that file. Choose a .json backup");
      return;
    }
    if (!Array.isArray(fileTasks)) {
      dogSays("That file isn't a task backup");
      return;
    }

    // Which tasks do we already have? Backups from v0.7 on carry each task's permanent id:
    // the same id = the same task. Older backups have no ids, so for those, the same text
    // AND the same due date counts as the same task (the way it always worked)
    const haveIds = tasks.map((task) => task.id);
    const haveKeys = tasks.map((task) => task.text + "|" + task.dueDate);
    const newTasks = [];
    let skipped = 0;
    fileTasks.forEach((fileTask) => {
      const task = cleanTask(fileTask);
      if (task === null) {
        return;   // broken task: skip it
      }
      const hadId = typeof fileTask.id === "string" && fileTask.id !== "";
      const key = task.text + "|" + task.dueDate;
      const alreadyHere = hadId ? haveIds.includes(task.id) : haveKeys.includes(key);
      if (alreadyHere) {
        skipped = skipped + 1;
        return;
      }
      newTasks.push(task);
      haveIds.push(task.id);   // so the same task in the file isn't added twice
      haveKeys.push(key);
    });

    addTasks(newTasks);
    if (newTasks.length === 0) {
      dogSays("No new tasks. You already have everything in that file");
    } else {
      dogSays("Restored " + plural(newTasks.length, "task") + (skipped ? ". " + skipped + " already here" : ""));
    }
  }

  // ---------- UNDO AFTER DELETE ----------
  // Delete a task, but remember it and its place for 10 seconds, so Undo can bring it back.
  // A new delete replaces the old one: only the last task can come back
  function handleDelete(id) {
    const index = tasks.findIndex((task) => task.id === id);
    setUndo({ task: tasks[index], index, key: Date.now() });   // key: a new bar for each delete
    deleteTask(id);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 10000);
  }

  function handleUndo() {
    restoreTask(undo.task, undo.index);
    clearTimeout(undoTimer.current);
    setUndo(null);
  }

  // The functions the dog coach is allowed to use (its "Delete" also offers Undo)
  const coachActions = {
    addTask,
    updateTask,
    deleteTask: handleDelete,
    runDog,
    completeTask: function (id) {
      toggleDone(id);
      celebrate(tasks.find((task) => task.id === id));
    }
  };

  // Today's date above the title, e.g. "Sunday 1 November"
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // A function that draws one task card (used for both sections)
  function drawTask(task) {
    return (
      <TaskItem
        key={task.id}
        task={task}
        onToggle={(event) => handleToggle(task, event)}
        onUpdate={(changes) => updateTask(task.id, changes)}
        onDelete={() => handleDelete(task.id)}
        onMove={(listKey) => handleMove(task, listKey)}
        onStar={() => handleStar(task)}
        onAllSteps={(count) => dogSays((count === 1 ? "The step is done" : "All " + count + " steps done") + ". Tick the task when you’re ready")}
      />
    );
  }

  // ---------- THE PAGE ----------
  // JSX looks like HTML, with a few differences: class is written className,
  // and {curly brackets} put JavaScript values into the page
  return (
    <>
      <div className={menuOpen ? "layout" : "layout is-collapsed"}>
        <Sidebar
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          search={search}
          onSearch={setSearch}
          filter={filter}
          onChoose={chooseFilter}
          counts={counts}
          projects={projects}
          contexts={contexts}
          onSortInbox={() => setCoach({ mode: "sort", key: Date.now() })}
          onReview={() => setCoach({ mode: "review", key: Date.now() })}
          onDownload={downloadTasks}
          onRestoreFile={restoreFile}
        />

        {/* On phones, tapping the dimmed page beside the open menu closes it */}
        <div className="scrim" onClick={() => setMenuOpen(false)}></div>

        <div className="main-area">
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>{commands}</span>
            </div>
          </div>

          <main className="app">
            <div className="header">
              <div className="header-text">
                <p className="eyebrow">{today}</p>
                <h1>
                  Things <em>to do<svg className="scribble" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 13 C 40 5, 80 17, 120 9 S 180 6, 197 12" /></svg></em>
                </h1>
                <p className="subtitle">Get it out of your head, then decide the next step.</p>
              </div>

              <div className="dog-spot">
                <p className={bubble.show ? "bubble show" : "bubble"}>{bubble.text}</p>
                <button
                  className={bubble.show ? "mascot hop" : "mascot"}
                  aria-label="Pet the dog"
                  title="Pet the dog"
                  onClick={() => dogSays(dogTip(todo, done))}
                >
                  <Dog />
                </button>
              </div>

              <button id="theme-button" aria-label="Switch light or dark mode" onClick={() => setIsDark(!isDark)}>
                <Icon name={isDark ? "sun" : "moon"} />
              </button>
            </div>

            <div className="input-row">
              <div className="input-wrap">
                <input
                  type="text"
                  id="task-input"
                  placeholder="What’s on your mind?"
                  aria-label="New task"
                  value={newText}
                  onChange={(event) => setNewText(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {/* The grey rest of a date word, lying exactly over the box */}
                {suggestion && (
                  <span className="ghost" aria-hidden="true">
                    <span className="ghost-typed">{newText}</span>{suggestion}
                  </span>
                )}
                {/* Two small icons inside the box, at its right end. Each fills butter yellow
                    when something is waiting to go into the task.
                    The paw (steps) only appears once you've started typing a task */}
                {(newText !== "" || newSteps.length > 0) && (
                  <button
                    className={newSteps.length ? "icon-button paw-button on" : "icon-button paw-button"}
                    title={newStepsOpen ? "Hide steps" : "Add steps"}
                    aria-label={newStepsOpen ? "Hide steps" : "Add steps"}
                    aria-expanded={newStepsOpen}
                    onClick={() => setNewStepsOpen(!newStepsOpen)}
                  >
                    <Icon name="paw" />
                  </button>
                )}
                <button
                  className={newNotes.trim() ? "icon-button notes-button new-notes-button on" : "icon-button notes-button new-notes-button"}
                  title={newNotesOpen ? "Hide notes" : "Add notes"}
                  aria-label={newNotesOpen ? "Hide notes" : "Add notes"}
                  aria-expanded={newNotesOpen}
                  onClick={() => setNewNotesOpen(!newNotesOpen)}
                >
                  <Icon name="notes" />
                </button>
              </div>
              {/* Notes and steps for the new task, right under the task box and exactly as wide
                  (the row is a grid: see .input-row). What's written here goes into the task on Add */}
              {(newNotesOpen || newStepsOpen) && (
                <div className="new-details">
                  {newNotesOpen && (
                    <textarea
                      className="notes-box new-notes-box"
                      aria-label="Notes for the new task"
                      placeholder="Add notes or links"
                      rows="3"
                      value={newNotes}
                      onChange={(event) => setNewNotes(event.target.value)}
                    />
                  )}
                  {newStepsOpen && <StepList steps={newSteps} onChange={setNewSteps} />}
                </div>
              )}
              <button id="add-button" onClick={handleAdd}>Add</button>
            </div>
            {/* THE HELPER under the Add button: the Lhasa Apso and its speech bubble.
                While you type it says what it understood; otherwise it teaches a trick */}
            <div className="helper">
              <p className="helper-bubble">
                {suggestion && (
                  // onMouseDown + preventDefault keeps the box focused, so a phone's keyboard stays open
                  <button className="suggest-button" onMouseDown={(event) => event.preventDefault()} onClick={completeWord}>
                    Tab: {suggestedWord}
                  </button>
                )}
                {found.length > 0 && found.join(" · ")}
                {!suggestion && found.length === 0 && (
                  <>
                    {/* TaskText turns #garden and @home into colored chips, like on the task cards */}
                    <TaskText text={TRICKS[trick]} />
                    <span className="trick-count">{trick + 1}/{TRICKS.length}</span>
                  </>
                )}
              </p>
              <button className="lhasa-button" title="Tap for another trick" aria-label="Show the next trick" onClick={() => setTrick((trick + 1) % TRICKS.length)}>
                <Lhasa />
              </button>
            </div>

            <div className="details-row">
              <input type="date" id="date-input" aria-label="Due date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
              <select id="priority-input" aria-label="Priority" value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <select id="repeat-input" aria-label="Repeat" value={newRepeat} onChange={(event) => setNewRepeat(event.target.value)}>
                <option value="">Doesn’t repeat</option>
                {Object.keys(REPEAT_NAMES).map((repeat) => (
                  <option key={repeat} value={repeat}>Repeats {repeat}</option>
                ))}
              </select>
            </div>

            {showNoResults && <p className="no-results">{emptyMessage(search, filter)}</p>}

            {showTodo && (
              <section className="task-section">
                <h2 className="section-title">To do <span className="section-count">{todo.length}</span></h2>
                <ul className="task-list" id="task-list" data-empty="Nothing to do. Add a task above">
                  {visibleTodo.map(drawTask)}
                </ul>
              </section>
            )}

            {showDone && (
              <section className="task-section">
                <h2 className="section-title">Done <span className="section-count">{done.length}</span></h2>
                <ul className="task-list" id="done-list" data-empty="Finished tasks show up here">
                  {visibleDone.map(drawTask)}
                </ul>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* The dog coach, only on the page while it's open */}
      {coach && <Coach key={coach.key} mode={coach.mode} tasks={tasks} actions={coachActions} onClose={() => setCoach(null)} />}

      {/* Running dogs and paw prints */}
      {runners.map((id) => (
        <div key={id} className="dog-runner"><Dog /></div>
      ))}
      {paws.map((paw) => (
        <span key={paw.id} className="paw-print" style={{ left: paw.left + "px", top: paw.top + "px", animationDelay: paw.delay + "ms" }}>
          <Icon name="paw" />
        </span>
      ))}

      {/* The Undo bar, for 10 seconds after a delete */}
      {undo && <UndoBar key={undo.key} text={undo.task.text} onUndo={handleUndo} />}
    </>
  );
}
