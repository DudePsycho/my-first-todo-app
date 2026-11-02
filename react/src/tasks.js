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

// The other way round: "2026-11-05" becomes a Date (midnight that day, on this computer)
export function toDate(text) {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// A date some days later (a minus: earlier). plusDays("2026-11-30", 1) = "2026-12-01"
export function plusDays(text, days) {
  const date = toDate(text);
  date.setDate(date.getDate() + days);
  return dateString(date);
}

// Settings (dark mode, the menu, your templates) are nice to remember, but not worth crashing over:
// if the browser's storage is full or blocked, they just aren't remembered
export function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // not remembered this time: that's fine
  }
}

export function recall(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

// Is this text a real time of day, like "09:30" or "15:00"?
function isRealTime(text) {
  return typeof text === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

// The time of a moment as "HH:MM", e.g. timeOf(new Date()) = the time right now, "15:04"
export function timeOf(moment) {
  return String(moment.getHours()).padStart(2, "0") + ":" + String(moment.getMinutes()).padStart(2, "0");
}

// A date for people: "2026-11-06" becomes "Fri 6 Nov"
export function shortDay(date) {
  return toDate(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// Is it a real calendar date? "2026-99-99" has the right shape but isn't one:
// JavaScript rolls it over to some other day, so it no longer matches the text
function isRealDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  return dateString(toDate(text)) === text;
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
    repeatDay: Number.isInteger(task.repeatDay) && task.repeatDay >= 1 && task.repeatDay <= 31 ? task.repeatDay : 0,
    // The day it was finished, for the History. Unfinished tasks, and tasks finished
    // before History existed, have none: ""
    doneDate: task.done === true && isRealDate(task.doneDate) ? task.doneDate : "",
    // A reminder time like "15:00" ("" = no reminder), and the day it last went off
    // (so it goes off only once on its day)
    remindAt: isRealTime(task.remindAt) ? task.remindAt : "",
    remindedOn: isRealDate(task.remindedOn) ? task.remindedOn : "",
    // When it was made (for "Newest first" on the board). Tasks from before this have 0
    createdAt: Number.isFinite(task.createdAt) && task.createdAt > 0 ? task.createdAt : 0
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
  const date = toDate(task.dueDate || today);
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

// A reminder time: "at 3pm", "at 3:30pm", "at 15:30" or "at 9" (= 09:00)
const TIME_PATTERN = /(^|\s)at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?=\s|$)/i;

// The pieces of a TIME_PATTERN match turned into "HH:MM", or "" if it isn't a real time
function timeFromMatch(match) {
  let hours = Number(match[2]);
  const minutes = match[3] || "00";
  const half = (match[4] || "").toLowerCase();
  if (half !== "" && (hours < 1 || hours > 12)) {
    return "";   // "at 15pm" isn't a time
  }
  if (half === "pm" && hours !== 12) {
    hours = hours + 12;
  }
  if (half === "am" && hours === 12) {
    hours = 0;   // 12am is midnight
  }
  const time = String(hours).padStart(2, "0") + ":" + minutes;
  return isRealTime(time) ? time : "";
}

export function parseQuickAdd(text) {
  let priority = "";
  let dueDate = "";
  let repeat = "";
  let remindAt = "";

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

  // at 3pm, at 15:30...
  const timeMatch = text.match(TIME_PATTERN);
  if (timeMatch && timeFromMatch(timeMatch) !== "") {
    remindAt = timeFromMatch(timeMatch);
    text = text.replace(timeMatch[0], " ");
  }

  // Squash the gaps left behind into single spaces
  return { text: text.replace(/\s+/g, " ").trim(), priority, dueDate, repeat, remindAt };
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

// STREAKS: how many days in a row you finished at least one task.
// "current" counts back from today; if nothing is finished yet today, it counts back from
// yesterday (today is still open). "best" is the longest run in your history
export function streaks(doneTasks) {
  // Every day with at least one finished task, oldest first ("YYYY-MM-DD" text sorts like dates)
  const days = [];
  doneTasks.forEach((task) => {
    if (task.doneDate !== "" && !days.includes(task.doneDate)) {
      days.push(task.doneDate);
    }
  });
  days.sort();

  // Best: walk through the days; a day right after the one before makes the run longer
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && plusDays(days[index - 1], 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
  });

  // Current: start at today (or yesterday) and count back while every day has a finished task
  let back = days.includes(todayString()) ? 0 : 1;
  let current = 0;
  while (days.includes(plusDays(todayString(), -back))) {
    current = current + 1;
    back = back + 1;
  }
  return { current, best };
}

// DOG LEVELS: the dog grows as you finish tasks (every finished task counts, ever).
// "at" is how many finished tasks reach that level
export const LEVELS = [
  { name: "Puppy", at: 0 },
  { name: "Good pup", at: 10 },
  { name: "Trail dog", at: 25 },
  { name: "Pack leader", at: 50 },
  { name: "Best in show", at: 100 }
];

// The level for a number of finished tasks: its place in LEVELS (0 = Puppy)
export function dogLevel(finished) {
  let level = 0;
  LEVELS.forEach((step, index) => {
    if (finished >= step.at) {
      level = index;
    }
  });
  return level;
}

// How far along the way to the next level: 0 (just reached this one) to 1 (there).
// At the top level there's nowhere further to go: always 1
export function levelProgress(finished) {
  const level = dogLevel(finished);
  const next = LEVELS[level + 1];
  if (!next) {
    return 1;
  }
  return (finished - LEVELS[level].at) / (next.at - LEVELS[level].at);
}

// FORMATTED NOTES are saved as HTML ("<p>Buy <strong>milk</strong></p>"). Notes from before
// formatting existed are plain text. A formatted note always starts with a tag
function isFormatted(notes) {
  return notes.trim().startsWith("<");
}

// An old plain note, turned into formatted text: each line becomes a paragraph.
// & < > are written as codes first, so text like "a < b" stays text
export function notesToHtml(notes) {
  if (notes === "" || isFormatted(notes)) {
    return notes;
  }
  const safe = notes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return safe.split("\n").map((line) => "<p>" + line + "</p>").join("");
}

// Just the words of a note (for search and for finding links), without the formatting.
// The tags become spaces, so words from two paragraphs don't run together. DOMParser
// reads HTML WITHOUT running anything in it, and turns codes like &amp; back into &
export function notesText(notes) {
  if (!isFormatted(notes)) {
    return notes;
  }
  const words = notes.replace(/<[^>]*>/g, " ");
  return new DOMParser().parseFromString(words, "text/html").documentElement.textContent.replace(/\s+/g, " ").trim();
}
