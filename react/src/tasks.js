// Helpers about tasks. There is no React in this file: these are the same ideas as in the
// plain script.js, only they take a task's data and return an answer (they never touch the page)

// GTD LISTS: every unfinished task lives in one of these 4 lists
export const LIST_NAMES = {
  inbox: "Inbox",        // just captured, not sorted yet
  next: "Next",          // the very next steps you can do
  waiting: "Waiting",    // someone else has to do something first
  someday: "Someday"     // ideas for later, no pressure
};

// The filters that only show unfinished tasks: today's stars, plus every list
export const LIST_FILTERS = ["focus"].concat(Object.keys(LIST_NAMES));

// REPEATING TASKS: the choices (a task that doesn't repeat has repeat: "")
export const REPEAT_NAMES = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly"
};

// A pattern that finds tags in task text: @home (a context) or #garden (a project).
// A tag starts with @ or #, is not glued to a word before it (so an email like a@b.com is no tag),
// and is made of letters, numbers, - or _. (\B means "not right after a letter")
export const TAG_PATTERN = /\B([@#][\p{L}\p{N}_-]+)/gu;

// Find all tags of one kind ("@" or "#") in a text, in small letters
export function findTags(text, symbol) {
  const tags = text.match(TAG_PATTERN) || [];
  const found = [];
  tags.forEach(function (tag) {
    tag = tag.toLowerCase();
    if (tag[0] === symbol && !found.includes(tag)) {
      found.push(tag);
    }
  });
  return found;
}

// The tag colors (CSS variables in style.css)
const TAG_COLORS = ["blue", "peach", "lavender", "aqua", "rose", "lime", "sand"];

// Pick a color for a tag from its name. It looks random, but the same name always gets
// the same color (so #garden doesn't change color every time the page is drawn).
// It turns the letters into one big number, then picks a color with % (the remainder)
export function tagColor(tag) {
  let number = 0;
  for (const letter of tag.toLowerCase()) {
    number = (number * 31 + letter.charCodeAt(0)) % 1000003;
  }
  return "var(--tag-" + TAG_COLORS[number % TAG_COLORS.length] + ")";
}

// A date as "YYYY-MM-DD" text, the shape of our due dates (so they can be compared).
// Built by hand, so it never depends on the computer's language settings
export function dateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");   // padStart: 5 becomes "05"
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// Today as "YYYY-MM-DD"
export function todayString() {
  return dateString(new Date());
}

// Is it a real calendar date? "2026-99-99" has the right shape but isn't one:
// JavaScript rolls it over to some other day, so it no longer matches the text
function isRealDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const [year, month, day] = text.split("-").map(Number);
  return dateString(new Date(year, month - 1, day)) === text;
}

// A new permanent id for a task: a long random code that never repeats.
// crypto.randomUUID() is built into browsers; the second line is for very old ones
export function newId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Check one task (from the saved data or a backup file) and fix anything missing.
// It returns null if the task can't be used at all
export function cleanTask(task) {
  // A task must at least have some text
  if (!task || typeof task.text !== "string" || task.text.trim() === "") {
    return null;
  }

  // Only allow the three priorities we know, otherwise use "medium"
  let priority = task.priority;
  if (priority !== "high" && priority !== "medium" && priority !== "low") {
    priority = "medium";
  }

  // Only allow real calendar dates, otherwise no date
  const dueDate = isRealDate(task.dueDate) ? task.dueDate : "";

  // Only allow the four lists we know. Old tasks have no list: use "next"
  let status = task.status;
  if (!Object.keys(LIST_NAMES).includes(status)) {
    status = "next";
  }

  return {
    text: task.text.trim(),
    done: task.done === true,
    dueDate: dueDate,
    priority: priority,
    status: status,
    focus: task.focus === true,
    // Only the three repeats we know. Old tasks have none: ""
    repeat: Object.keys(REPEAT_NAMES).includes(task.repeat) ? task.repeat : "",
    // Notes are free text. Old tasks have none: ""
    notes: typeof task.notes === "string" ? task.notes : "",
    // Steps (sub-tasks): a list of { text, done }. Anything broken or empty is dropped
    steps: Array.isArray(task.steps)
      ? task.steps
          .filter((step) => step && typeof step.text === "string" && step.text.trim() !== "")
          .map((step) => ({ text: step.text.trim(), done: step.done === true }))
      : [],
    // A permanent id. Old tasks and backups from before v0.7 have none: they get a new one
    id: typeof task.id === "string" && task.id !== "" ? task.id : newId(),
    // A ticked repeating task remembers the id of the fresh copy it made (to untick exactly that one)
    nextId: typeof task.nextId === "string" ? task.nextId : "",
    // Monthly repeats: the day of the month it should land on (0 = just use the due date's day)
    repeatDay: Number.isInteger(task.repeatDay) && task.repeatDay >= 1 && task.repeatDay <= 31 ? task.repeatDay : 0
  };
}

// Monthly repeats: the day of the month a task should land on. A task first due on the
// 31st keeps wanting the 31st, even after landing on the 28th in February
export function monthDay(task) {
  return task.repeatDay || Number((task.dueDate || todayString()).slice(8));
}

// The web links in a text: only ones starting with http:// or https://, so nothing
// else (like a javascript: trick) can ever become a link. A full stop or bracket
// right after a link is left out ("see https://a.com." gives "https://a.com")
export function findLinks(text) {
  const links = text.match(/https?:\/\/[^\s<>"]+/g) || [];
  return links.map((link) => link.replace(/[.,;:!?)]+$/, ""));
}

// The next due date of a repeating task: one step after its due date (no date: after today).
// If that's still in the past, keep stepping until it's today or later
export function nextDueDate(task) {
  const today = todayString();
  const [year, month, day] = (task.dueDate || today).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  do {
    if (task.repeat === "monthly") {
      // Go to the 1st of next month, then to the wanted day, or the month's last day if
      // the month is shorter: 31 Jan → 28 Feb → 31 Mar. (Day 0 of the month after = the last day)
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(monthDay(task), lastDay));
    } else {
      date.setDate(date.getDate() + (task.repeat === "daily" ? 1 : 7));
    }
  } while (dateString(date) < today);
  return dateString(date);
}

// SMART QUICK ADD: read extra info typed into the task text.
// "Call mum friday !high weekly" gives back
// { text: "Call mum", priority: "high", dueDate: "2026-11-06", repeat: "weekly" }

// Weekdays in the same order as JavaScript's getDay(): sunday = 0, monday = 1 … saturday = 6
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATE_WORDS = ["today", "tonight", "tomorrow"].concat(WEEKDAYS);

// A date word as a whole word: after a space (or the start), before a space (or the end).
// So "tomorrow's" doesn't count. "i" = capitals are fine
const DATE_PATTERN = new RegExp("(^|\\s)(" + DATE_WORDS.join("|") + ")(?=\\s|$)", "i");

// Turn a date word into a date like "2026-11-06"
function dateFromWord(word) {
  const date = new Date();   // today (also for "today" and "tonight")
  const day = WEEKDAYS.indexOf(word);   // -1 if it isn't a weekday
  if (word === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (day >= 0) {
    // Days until the next one: 1 to 7 (the same weekday as today means next week)
    date.setDate(date.getDate() + ((day - date.getDay() + 6) % 7) + 1);
  }
  return dateString(date);
}

// Repeat words, and the repeat each one means
const REPEAT_WORDS = {
  "daily": "daily", "every day": "daily",
  "weekly": "weekly", "every week": "weekly",
  "monthly": "monthly", "every month": "monthly"
};
const REPEAT_PATTERN = new RegExp("(^|\\s)(" + Object.keys(REPEAT_WORDS).join("|") + ")(?=\\s|$)", "i");

export function parseQuickAdd(text) {
  let priority = "";
  let dueDate = "";
  let repeat = "";

  // !high, !medium or !low (with the space before it)
  const priorityMatch = text.match(/\s*!(high|medium|low)\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase();
    text = text.replace(priorityMatch[0], "");
  }

  // today, tonight, tomorrow or a weekday
  const dateMatch = text.match(DATE_PATTERN);
  if (dateMatch) {
    dueDate = dateFromWord(dateMatch[2].toLowerCase());
    text = text.replace(dateMatch[0], " ");
  }

  // daily, every day, weekly, every week, monthly or every month
  const repeatMatch = text.match(REPEAT_PATTERN);
  if (repeatMatch) {
    repeat = REPEAT_WORDS[repeatMatch[2].toLowerCase()];
    text = text.replace(repeatMatch[0], " ");
  }

  // Squash the gaps left behind into single spaces
  return { text: text.replace(/\s+/g, " ").trim(), priority, dueDate, repeat };
}

// WORD COMPLETION: the rest of a date word you've started at the end of the text.
// "Lie in the sun" gives back "day". Only after 3+ letters that fit exactly one date word,
// otherwise "" (nothing to suggest)
export function suggestDateWord(text) {
  const lastWord = text.match(/(^|\s)([a-z]{3,})$/i);
  if (!lastWord) {
    return "";
  }
  const typed = lastWord[2].toLowerCase();
  const fits = DATE_WORDS.filter((word) => word.startsWith(typed) && word !== typed);
  return fits.length === 1 ? fits[0].slice(typed.length) : "";
}
