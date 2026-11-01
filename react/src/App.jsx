// THE APP: holds the app's memory (tasks, filter, search, dark mode, menu, the dog)
// and describes the whole page from it.
//
// The plain version had functions like applyFilter() and updateCounter() that you had to
// remember to call after every change. Here there are none: every time the memory changes,
// React runs App() again, and the counts, filters and lists are simply worked out fresh
import { useEffect, useRef, useState } from "react";
import { useTasks } from "./useTasks.js";
import { LIST_NAMES, LIST_FILTERS, findTags, cleanTask, tagColor, todayString } from "./tasks.js";
import Sidebar from "./Sidebar.jsx";
import TaskItem from "./TaskItem.jsx";
import Coach from "./Coach.jsx";
import Dog from "./Dog.jsx";
import Icon from "./Icon.jsx";

// The ink strip at the top: things we say to dogs, turned into to-do tips
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
    someday: "No someday ideas yet"
  };
  return messages[filter] || "No tasks match this filter";
}

export default function App() {
  const { tasks, addTask, updateTask, toggleDone, deleteTask, addTasks } = useTasks();

  // ---------- MEMORY: everything that can change on the page ----------
  const [newText, setNewText] = useState("");             // the "What's on your mind?" box
  const [newDate, setNewDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [filter, setFilter] = useState("all");            // "all", "inbox", "#garden"...
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("darkMode") === "true");
  // Menu: shrunk on phones, otherwise the way you left it (open the first time)
  const [menuOpen, setMenuOpen] = useState(() => !isPhone() && localStorage.getItem("menuOpen") !== "false");
  const [coach, setCoach] = useState(null);               // null (closed), or { mode: "sort" | "review", key }

  // The dog: its speech bubble, its hop, and the running dogs and paw prints on screen
  const [bubble, setBubble] = useState({ text: "", show: false });
  const [runners, setRunners] = useState([]);
  const [paws, setPaws] = useState([]);
  const bubbleTimer = useRef();   // useRef: memory that does NOT redraw the page when it changes

  // The strip's commands, shuffled once when the app opens (so every visit reads differently,
  // but they don't jump around while you use the app)
  const [commands] = useState(() => shuffle(DOG_COMMANDS).join(" ✦ ") + " ✦ ");

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
      localStorage.setItem("darkMode", isDark);
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
        localStorage.setItem("menuOpen", menuOpen);
      }
    },
    [menuOpen]
  );

  // ---------- WORKED OUT FRESH ON EVERY DRAW (no updateCounter needed) ----------
  const todo = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

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
    if (!task.text.toLowerCase().includes(searchWord)) {
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
    if (isTagFilter) {
      return findTags(task.text, filter[0]).includes(filter);
    }
    return true;   // "all", "active" and "done" show every task (the sections do the rest)
  }

  const visibleTodo = todo.filter(isVisible);
  const visibleDone = done.filter(isVisible);

  // Which sections to show. When searching or using a narrow filter, hide an empty section
  const isNarrowed = searchWord !== "" || !["all", "active", "done"].includes(filter);
  let showTodo = filter !== "done";
  let showDone = filter !== "active" && !LIST_FILTERS.includes(filter);
  if (isNarrowed) {
    showTodo = showTodo && visibleTodo.length > 0;
    showDone = showDone && visibleDone.length > 0;
  }
  const showNoResults = isNarrowed && !showTodo && !showDone;

  // ---------- THE DOG ----------
  function dogSays(message) {
    setBubble({ text: message, show: true });
    // If the dog was already talking, restart the countdown
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble((old) => ({ ...old, show: false })), 2200);
  }

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
  function celebrate() {
    runDog();
    const left = todo.length - 1;   // the task being finished is still in todo
    dogSays(left === 0 ? "Done. Nothing left to do" : "Done. " + plural(left, "task") + " left");
  }

  // ---------- WHAT HAPPENS WHEN YOU CLICK THINGS ----------
  function handleAdd() {
    if (newText.trim() === "") {
      return;
    }
    addTask(newText.trim(), newDate, newPriority, "inbox");
    dogSays("Added to Inbox. " + plural(counts.inbox + 1, "task") + " to sort");
    setNewText("");
    setNewDate("");
  }

  function handleToggle(task, event) {
    toggleDone(task.id);
    if (!task.done) {
      // It's being ticked: paw prints walk away from the checkbox
      const spot = event.target.getBoundingClientRect();
      pawPrints(spot.left + spot.width / 2, spot.top + spot.height / 2);
      celebrate();
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
    const savedText = localStorage.getItem("tasks") || "[]";
    if (tasks.length === 0) {
      dogSays("Nothing to back up yet");
      return;
    }
    // A Blob is a file made inside the browser. A hidden link downloads it
    const file = new Blob([savedText], { type: "application/json" });
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

    // A task counts as a duplicate if it has the same text AND the same due date
    const alreadyHave = tasks.map((task) => task.text + "|" + task.dueDate);
    const newTasks = [];
    fileTasks.forEach((fileTask) => {
      const task = cleanTask(fileTask);
      if (task === null) {
        return;   // broken task: skip it
      }
      const key = task.text + "|" + task.dueDate;
      if (!alreadyHave.includes(key)) {
        newTasks.push(task);
        alreadyHave.push(key);   // so the same task in the file isn't added twice
      }
    });

    addTasks(newTasks);
    if (newTasks.length === 0) {
      dogSays("No new tasks. You already have everything in that file");
    } else {
      dogSays("Restored " + plural(newTasks.length, "task"));
    }
  }

  // The functions the dog coach is allowed to use
  const coachActions = {
    addTask,
    updateTask,
    deleteTask,
    runDog,
    completeTask: function (id) {
      toggleDone(id);
      celebrate();
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
        onDelete={() => deleteTask(task.id)}
        onMove={(listKey) => handleMove(task, listKey)}
        onStar={() => handleStar(task)}
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
              <input
                type="text"
                id="task-input"
                placeholder="What’s on your mind?"
                aria-label="New task"
                value={newText}
                onChange={(event) => setNewText(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleAdd()}
              />
              <button id="add-button" onClick={handleAdd}>Add</button>
            </div>
            <p className="capture-tip">
              New tasks land in your Inbox. Add <span className="tag" style={{ "--tag-color": tagColor("@home") }}>@home</span> for a context or <span className="tag" style={{ "--tag-color": tagColor("#garden") }}>#garden</span> for a project.
            </p>

            <div className="details-row">
              <input type="date" id="date-input" aria-label="Due date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
              <select id="priority-input" aria-label="Priority" value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
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
    </>
  );
}
