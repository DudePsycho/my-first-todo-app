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

// Today as "YYYY-MM-DD", the same shape as our due dates (so they can be compared)
export function todayString() {
  return new Date().toLocaleDateString("en-CA");
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

  // Only allow dates that look like "YYYY-MM-DD", otherwise no date
  let dueDate = task.dueDate;
  if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    dueDate = "";
  }

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
    focus: task.focus === true
  };
}
