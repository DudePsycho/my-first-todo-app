// Tell the CSS that JavaScript is running (things that only JavaScript can show, like the
// dog's speech bubble, hide themselves until needed; without JavaScript nothing stays hidden)
document.documentElement.classList.add("js");

// STEP 1: Find the parts of the page we need to work with
const taskInput = document.getElementById("task-input");
const addButton = document.getElementById("add-button");
const taskList = document.getElementById("task-list");   // the "To do" list
const doneList = document.getElementById("done-list");   // the "Done" list
const dateInput = document.getElementById("date-input");
const priorityInput = document.getElementById("priority-input");

// LINE ICONS: small drawings on a 24×24 grid, used instead of emoji
// so they look the same on every phone and computer.
// Shapes (except the paw) from Lucide, https://lucide.dev, ISC License:
// Copyright (c) Lucide Contributors. Permission to use, copy, modify, and/or distribute this
// software for any purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  next: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  "list-checks": '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  "calendar-check": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  // Our own drawing: a paw print (filled, not outlined)
  paw: '<ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="5.5" cy="9.5" r="2.2"/><circle cx="9.5" cy="5.5" r="2.2"/><circle cx="14.5" cy="5.5" r="2.2"/><circle cx="18.5" cy="9.5" r="2.2"/>'
};

// A function that makes one icon (an <svg> drawing) by its name
function makeIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = ICONS[name];
  return svg;
}

// Swap every <span data-icon="..."> in the HTML for its drawing
document.querySelectorAll("[data-icon]").forEach(function (spot) {
  const svg = makeIcon(spot.dataset.icon);
  if (spot.className) {
    svg.classList.add(spot.className);   // keep classes like "search-icon"
  }
  spot.replaceWith(svg);
});

// A function that makes a small square button with just an icon (for the task cards)
function makeIconButton(iconName, label, className) {
  const button = document.createElement("button");
  button.className = "icon-button " + className;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.appendChild(makeIcon(iconName));
  return button;
}

// GTD LISTS: every unfinished task lives in one of these 4 lists
const LIST_NAMES = {
  inbox: "Inbox",        // just captured, not sorted yet
  next: "Next",          // the very next steps you can do
  waiting: "Waiting",    // someone else has to do something first
  someday: "Someday"     // ideas for later, no pressure
};

// A pattern that finds tags in task text: @home (a context) or #garden (a project).
// A tag starts with @ or #, comes after a space (or at the start), and is made of letters, numbers, - or _
const TAG_PATTERN = /(?<=^|\s)([@#][\p{L}\p{N}_-]+)/gu;

// A function that finds all tags of one kind ("@" or "#") in a text, in small letters
function findTags(text, symbol) {
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

// A function that writes the task text, turning @ and # words into little chips
function showTaskText(textSpan, text) {
  textSpan.textContent = "";

  // split() with the pattern gives: [plain text, tag, plain text, tag, ...]
  const parts = text.split(TAG_PATTERN);
  parts.forEach(function (part, index) {
    if (index % 2 === 1) {
      // Odd places are tags: make a chip
      const chip = document.createElement("span");
      chip.className = part[0] === "@" ? "tag tag-context" : "tag tag-project";
      chip.textContent = part;
      textSpan.appendChild(chip);
    } else {
      // Even places are normal text
      textSpan.appendChild(document.createTextNode(part));
    }
  });
}


// A function that writes the due date into a label (and turns it red if overdue)
function showDueDate(dateLabel, dueDate) {
  dateLabel.classList.remove("overdue");

  if (dueDate) {
    // Write the date in a short, friendly way, e.g. "Due 3 Nov"
    const niceDate = new Date(dueDate + "T00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    });
    dateLabel.textContent = "Due " + niceDate;

    // If the due date has already passed, mark it as overdue
    const today = new Date().toLocaleDateString("en-CA");
    if (dueDate < today) {
      dateLabel.classList.add("overdue");
    }
  } else {
    dateLabel.textContent = "";   // no date: show nothing
  }
}

// STEP 2: A function that builds one task on the page
// (status is "inbox", "next", "waiting" or "someday"; isFocus is true for today's ⭐ tasks)
function createTask(taskText, isDone, dueDate, priority, status, isFocus) {
  // Create a new list item to hold the task
  const listItem = document.createElement("li");

  // Create the text part of the task (with @ and # chips)
  const textSpan = document.createElement("span");
  textSpan.className = "task-text";
  showTaskText(textSpan, taskText);


  // Remember this task's due date, priority, list and star (data- notes, like the filter buttons).
  // Old tasks saved before the lists existed have no status: they go to "next"
  listItem.dataset.dueDate = dueDate || "";
  listItem.dataset.priority = priority || "medium";
  listItem.dataset.status = status || "next";
  listItem.dataset.focus = isFocus ? "true" : "false";

  // Color the task by its priority (adds a label like "priority-high")
  listItem.classList.add("priority-" + listItem.dataset.priority);

  // Create a small label that shows the due date
  const dateLabel = document.createElement("small");
  dateLabel.className = "due-date";
  showDueDate(dateLabel, dueDate);


  // Create a checkbox to mark the task as done
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  // If this task was already finished, tick the box and cross it out
  checkbox.checked = isDone;
  if (isDone) {
    textSpan.classList.add("done");
  }

  // When the checkbox is ticked or unticked, cross the text out (or not)
  // and move the task into the other section
  checkbox.addEventListener("change", function () {
    textSpan.classList.toggle("done");

    // Remember where the checkbox was, before the task moves (for the paw prints)
    const spot = checkbox.getBoundingClientRect();

    if (checkbox.checked) {
      doneList.appendChild(listItem);   // ticked: move to Done
    } else {
      taskList.appendChild(listItem);   // unticked: move back to To do
    }

    saveTasks();
    applyFilter();

    // Reward a finished task: paw prints walk away from it, and a dog runs across the screen
    if (checkbox.checked) {
      pawPrints(spot.left + spot.width / 2, spot.top + spot.height / 2);
      runDog();
      if (taskList.children.length === 0) {
        dogSays("All done. Best human ever 🎉");
      } else {
        dogSays("Nice one 🐾");
      }
    }
  });

  // Create an Edit button for this task
  const editButton = makeIconButton("pencil", "Edit task", "edit-button");

  // Boxes used while editing (hidden until Edit is clicked)
  const editTextInput = document.createElement("input");
  editTextInput.type = "text";
  editTextInput.className = "edit-text";
  editTextInput.style.display = "none";

  const editDateInput = document.createElement("input");
  editDateInput.type = "date";
  editDateInput.className = "edit-date";
  editDateInput.style.display = "none";

  // The Edit button has two modes: "Edit" starts editing, "Save" saves
  editButton.addEventListener("click", function () {
    if (editTextInput.style.display === "none") {
      // START EDITING: fill the boxes with the current text and date
      editTextInput.value = textSpan.textContent;
      editDateInput.value = listItem.dataset.dueDate;

      // Hide the normal text and date, show the edit boxes
      textSpan.style.display = "none";
      dateLabel.style.display = "none";
      editTextInput.style.display = "";
      editDateInput.style.display = "";

      editButton.replaceChildren(makeIcon("check"));   // the button now saves
      editButton.title = "Save";
    } else {
      // SAVE: don't allow an empty task
      const newText = editTextInput.value.trim();
      if (newText === "") {
        return;
      }

      // Update the task with the new text and date
      showTaskText(textSpan, newText);
      listItem.dataset.dueDate = editDateInput.value;
      showDueDate(dateLabel, editDateInput.value);

      // Hide the edit boxes, show the normal text and date again
      editTextInput.style.display = "none";
      editDateInput.style.display = "none";
      textSpan.style.display = "";
      dateLabel.style.display = "";

      editButton.replaceChildren(makeIcon("pencil"));
      editButton.title = "Edit task";
      saveTasks();
      applyFilter();   // the new text might not match the search any more
    }
  });

  // Create a Delete button for this task
  const deleteButton = makeIconButton("trash", "Delete task", "delete-button");

  // When Delete is clicked, remove this task from the list
  deleteButton.addEventListener("click", function () {
    listItem.remove();
    saveTasks();
    applyFilter();   // update the "no tasks match" message if needed
  });

  // Create the list picker (Inbox, Next, Waiting, Someday)
  const statusSelect = document.createElement("select");
  statusSelect.className = "status-select";
  statusSelect.title = "Move to another list";
  Object.keys(LIST_NAMES).forEach(function (listKey) {
    const option = document.createElement("option");
    option.value = listKey;
    option.textContent = LIST_NAMES[listKey];
    statusSelect.appendChild(option);
  });
  statusSelect.value = listItem.dataset.status;

  // When another list is picked, move the task there
  statusSelect.addEventListener("change", function () {
    listItem.dataset.status = statusSelect.value;
    saveTasks();
    applyFilter();
    dogSays("Moved to " + LIST_NAMES[statusSelect.value]);
  });

  // Create the star button: star a task to put it in today's focus
  const focusButton = makeIconButton("star", "Add to today", "focus-button");
  showFocus(focusButton, isFocus);

  focusButton.addEventListener("click", function () {
    const isFocusNow = listItem.dataset.focus !== "true";   // flip it
    listItem.dataset.focus = isFocusNow ? "true" : "false";
    showFocus(focusButton, isFocusNow);
    saveTasks();
    applyFilter();
    if (isFocusNow) {
      dogSays("On today's list ⭐");
    }
  });

  // Put the text and the button inside the list item
  // Order: the parts that change size (text, date) come first,
  // so the star, list picker and buttons always line up on the right
  listItem.appendChild(checkbox);
  listItem.appendChild(textSpan);
  listItem.appendChild(editTextInput);
  listItem.appendChild(dateLabel);
  listItem.appendChild(editDateInput);
  listItem.appendChild(focusButton);
  listItem.appendChild(statusSelect);
  listItem.appendChild(editButton);
  listItem.appendChild(deleteButton);




  // Put the list item into the right section: finished tasks go to Done
  if (isDone) {
    doneList.appendChild(listItem);
  } else {
    taskList.appendChild(listItem);
  }

  // Give the task back, so other code (like the dog coach) can use it
  return listItem;
}

// A function that shows a star button as filled (on) or empty (off)
function showFocus(focusButton, isFocus) {
  if (isFocus) {
    focusButton.title = "Remove from today";
    focusButton.classList.add("on");   // the CSS fills the star with butter yellow
  } else {
    focusButton.title = "Add to today";
    focusButton.classList.remove("on");
  }
  focusButton.setAttribute("aria-label", focusButton.title);
}

// A function that reads the text box and adds a new task
function addTask() {
  // Get what the user typed, and remove extra spaces at the start/end
  const taskText = taskInput.value.trim();

  // If the box is empty, do nothing
  if (taskText === "") {
    return;
  }

  // Build the task (not done yet, in the inbox), then save
  createTask(taskText, false, dateInput.value, priorityInput.value, "inbox", false);
  saveTasks();
  applyFilter();
  dogSays("In the inbox. We'll sort it later");

  // Clear the text box so it's ready for the next task
  taskInput.value = "";
  dateInput.value = "";

}

// A function that saves every task into the browser's memory
function saveTasks() {
  const tasks = [];

  // Look at each task in BOTH sections and note its text and whether it's done
  document.querySelectorAll(".task-list li").forEach(function (listItem) {
    tasks.push({
      text: listItem.querySelector(".task-text").textContent,
      done: listItem.querySelector("input").checked,
      dueDate: listItem.dataset.dueDate,
      priority: listItem.dataset.priority,
      status: listItem.dataset.status,
      focus: listItem.dataset.focus === "true"
    });

  });

  // Turn the list into text and store it under the name "tasks"
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateCounter();
}

// A function that loads saved tasks back onto the page
function loadTasks() {
  // Read the saved text and turn it back into a list (or use an empty list if there's nothing saved)
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Build each saved task on the page
  savedTasks.forEach(function (task) {
  createTask(task.text, task.done, task.dueDate, task.priority, task.status, task.focus);

  });
}

// STEP 3: Run addTask when the Add button is clicked
addButton.addEventListener("click", addTask);

// ...or when the Enter key is pressed inside the text box
taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

// Remember which filter is chosen:
// "all", "active", "done", "high", "medium", "low",
// a list ("focus", "inbox", "next", "waiting", "someday"),
// a project like "#garden" or a context like "@home"
let currentFilter = "all";

const todoSection = document.getElementById("todo-section");
const doneSection = document.getElementById("done-section");

// The filters that only show unfinished tasks: today's stars, plus every list in LIST_NAMES
const LIST_FILTERS = ["focus"].concat(Object.keys(LIST_NAMES));

// A function that checks if one task fits the chosen filter (true or false)
function taskMatchesFilter(listItem) {
  const isUnfinished = listItem.parentElement === taskList;

  if (currentFilter === "high" || currentFilter === "medium" || currentFilter === "low") {
    return listItem.dataset.priority === currentFilter;
  }

  if (currentFilter === "focus") {
    return isUnfinished && listItem.dataset.focus === "true";
  }

  if (LIST_FILTERS.includes(currentFilter)) {
    return isUnfinished && listItem.dataset.status === currentFilter;
  }

  // A project (#) or context (@): does the task text have that tag?
  if (currentFilter[0] === "#" || currentFilter[0] === "@") {
    const taskText = listItem.querySelector(".task-text").textContent;
    return findTags(taskText, currentFilter[0]).includes(currentFilter);
  }

  return true;   // "all", "active" and "done" show every task (the sections do the rest)
}

// A function that shows or hides sections and tasks based on the chosen filter
function applyFilter() {
  // 1. Show or hide whole sections
  if (currentFilter === "active" || LIST_FILTERS.includes(currentFilter)) {
    todoSection.style.display = "";
    doneSection.style.display = "none";   // only unfinished tasks
  } else if (currentFilter === "done") {
    todoSection.style.display = "none";   // only finished tasks
    doneSection.style.display = "";
  } else {
    todoSection.style.display = "";
    doneSection.style.display = "";
  }

  // 2. Read the search box. toLowerCase() makes "MILK" and "milk" match
  const searchWord = searchInput.value.trim().toLowerCase();
  let matchCount = 0;

  // 3. Show the tasks that fit the filter AND the search, hide the rest
  document.querySelectorAll(".task-list li").forEach(function (listItem) {
    const taskText = listItem.querySelector(".task-text").textContent.toLowerCase();

    if (!taskMatchesFilter(listItem)) {
      listItem.style.display = "none";   // hide: doesn't fit the filter
    } else if (!taskText.includes(searchWord)) {
      listItem.style.display = "none";   // hide: doesn't contain the search word
    } else {
      listItem.style.display = "";       // show the task
      matchCount = matchCount + 1;
    }
  });

  // 4. When searching or using a narrow filter, hide a section if none of its tasks show
  const isNarrowed = searchWord !== "" || (currentFilter !== "all" && currentFilter !== "active" && currentFilter !== "done");
  if (isNarrowed) {
    if (!sectionHasVisibleTask(taskList)) {
      todoSection.style.display = "none";
    }
    if (!sectionHasVisibleTask(doneList)) {
      doneSection.style.display = "none";
    }
  }

  // 5. If nothing is left to show, say something kind
  if (isNarrowed && matchCount === 0) {
    noResults.textContent = emptyMessage(searchWord);
    noResults.hidden = false;
  } else {
    noResults.hidden = true;
  }
}

// A function that picks the "nothing here" message for the chosen filter
function emptyMessage(searchWord) {
  if (searchWord !== "") {
    return "no tasks match \"" + searchInput.value.trim() + "\" 🐶";
  } else if (currentFilter === "inbox") {
    return "inbox zero. the dog is impressed 🐶";
  } else if (currentFilter === "focus") {
    return "no stars yet. tap the star on a task to plan your day";
  } else if (currentFilter === "next") {
    return "no next steps yet. sort your inbox with the dog? 🐶";
  } else if (currentFilter === "waiting") {
    return "not waiting on anyone. lovely 🐾";
  } else if (currentFilter === "someday") {
    return "no someday ideas yet. dream a little 🌙";
  } else {
    return "nothing here right now 🐾";
  }
}

// A function that checks if a list has at least one task showing
function sectionHasVisibleTask(list) {
  const tasks = list.querySelectorAll("li");
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].style.display !== "none") {
      return true;
    }
  }
  return false;
}

// SEARCH: re-check the tasks every time something is typed (or the ✕ is clicked)
const searchInput = document.getElementById("search-input");
const noResults = document.getElementById("no-results");

searchInput.addEventListener("input", applyFilter);

// A function that runs when a filter button is clicked
function chooseFilter(button) {
  // Remember which filter was chosen (read from data-filter)
  currentFilter = button.dataset.filter;

  // Make only this button look chosen
  document.querySelectorAll(".filter-button").forEach(function (otherButton) {
    otherButton.classList.remove("active");
  });
  button.classList.add("active");

  // And show or hide the tasks
  applyFilter();
}

// Every filter button that is already on the page runs chooseFilter when clicked
// (the project and context buttons are made later, in updateTagMenus)
document.querySelectorAll(".filter-button").forEach(function (button) {
  button.addEventListener("click", function () {
    chooseFilter(button);
  });
});

// PROJECTS AND CONTEXTS: the sidebar buttons are rebuilt from the task text
// A function that builds one sidebar menu for "#" (projects) or "@" (contexts)
function buildTagMenu(symbol, menu) {
  // Count the unfinished tasks for each tag, e.g. { "#garden": 2, "#trip": 1 }
  const counts = {};
  taskList.querySelectorAll("li").forEach(function (listItem) {
    const taskText = listItem.querySelector(".task-text").textContent;
    findTags(taskText, symbol).forEach(function (tag) {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });

  const tags = Object.keys(counts).sort();

  // Empty the menu, then add one button per tag
  menu.innerHTML = "";
  tags.forEach(function (tag) {
    const button = document.createElement("button");
    button.className = "filter-button";
    button.dataset.filter = tag;

    // A # or @ icon, then the name without its symbol: "#garden" shows as [#] garden
    button.appendChild(makeIcon(symbol === "#" ? "hash" : "at"));
    button.appendChild(document.createTextNode(tag.slice(1) + " "));

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = counts[tag];
    button.appendChild(count);

    if (tag === currentFilter) {
      button.classList.add("active");   // keep the chosen one highlighted
    }
    button.addEventListener("click", function () {
      chooseFilter(button);
    });
    menu.appendChild(button);
  });

  // Hide the menu when no task uses this kind of tag
  menu.hidden = tags.length === 0;

  return tags;
}

// A function that rebuilds both tag menus (they share one "Tags" title)
function updateTagMenus() {
  const projects = buildTagMenu("#", document.getElementById("projects-menu"));
  const contexts = buildTagMenu("@", document.getElementById("contexts-menu"));

  // Hide the "Tags" title when there are no tags at all
  document.getElementById("tags-title").hidden = projects.length === 0 && contexts.length === 0;

  // If the chosen tag no longer exists (e.g. its last task was finished), go back to "All"
  const isTagFilter = currentFilter[0] === "#" || currentFilter[0] === "@";
  if (isTagFilter && !projects.includes(currentFilter) && !contexts.includes(currentFilter)) {
    chooseFilter(document.querySelector('.filter-button[data-filter="all"]'));
  }
}

// DARK MODE: the button switches between light and dark
const themeButton = document.getElementById("theme-button");

// A function that turns dark mode on (true) or off (false)
function setDarkMode(isDark) {
  if (isDark) {
    document.documentElement.dataset.theme = "dark";   // <html data-theme="dark">: the CSS swaps the colors
    themeButton.replaceChildren(makeIcon("sun"));    // a sun: click to go back to light
  } else {
    delete document.documentElement.dataset.theme;
    themeButton.replaceChildren(makeIcon("moon"));   // a moon: click for dark mode
  }

  // Remember the choice for next time
  localStorage.setItem("darkMode", isDark);
}

// When the button is clicked, switch to the opposite mode
themeButton.addEventListener("click", function () {
  const isDarkNow = document.documentElement.dataset.theme === "dark";
  setDarkMode(!isDarkNow);
});

// When the page opens, use the mode that was saved last time
setDarkMode(localStorage.getItem("darkMode") === "true");

// A function that updates every number on the page
const taskCounter = document.getElementById("task-counter");
const progressFill = document.getElementById("progress-fill");

function updateCounter() {
  const active = taskList.querySelectorAll("li").length;
  const done = doneList.querySelectorAll("li").length;
  const total = active + done;

  // Numbers in the menu
  document.getElementById("count-all").textContent = total;
  document.getElementById("count-active").textContent = active;
  document.getElementById("count-done").textContent = done;

  // Priority numbers: count the tasks with each priority label
  ["high", "medium", "low"].forEach(function (priority) {
    const count = document.querySelectorAll(".task-list li.priority-" + priority).length;
    document.getElementById("count-" + priority).textContent = count;
  });

  // List numbers: count the UNFINISHED tasks in each list, and today's stars
  Object.keys(LIST_NAMES).forEach(function (listKey) {
    const count = taskList.querySelectorAll('li[data-status="' + listKey + '"]').length;
    document.getElementById("count-" + listKey).textContent = count;
  });
  document.getElementById("count-focus").textContent = taskList.querySelectorAll('li[data-focus="true"]').length;

  // Rebuild the Projects (#) and Contexts (@) menus
  updateTagMenus();

  // Numbers next to the section titles
  document.getElementById("todo-count").textContent = active;
  document.getElementById("done-count").textContent = done;

  // The progress bar and the "2 of 5 done" next to it
  if (total === 0) {
    taskCounter.textContent = "No tasks yet";
    progressFill.style.transform = "scaleX(0)";
  } else {
    taskCounter.textContent = done + " of " + total + " done";
    // The fill is always full width, then squashed from the left: scaleX(0.4) shows 40%
    // (squashing is smoother for the browser than changing the width)
    progressFill.style.transform = "scaleX(" + done / total + ")";
  }
}


// ---------- BACKUP & RESTORE 💾 ----------
const downloadButton = document.getElementById("download-button");
const restoreButton = document.getElementById("restore-button");
const restoreInput = document.getElementById("restore-input");

// A function that saves all tasks into a file on your computer
function downloadTasks() {
  // The tasks are already saved as text under "tasks", so we reuse that
  const savedText = localStorage.getItem("tasks") || "[]";

  // Nothing to back up? Tell the user instead of making an empty file
  if (JSON.parse(savedText).length === 0) {
    dogSays("No tasks to back up yet 🐾");
    return;
  }

  // A Blob is a file made inside the browser. This one holds our tasks as text
  const file = new Blob([savedText], { type: "application/json" });

  // Make a hidden link to the file, click it to download, then clean up
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "my-tasks-" + new Date().toLocaleDateString("en-CA") + ".json";   // e.g. my-tasks-2026-11-01.json
  link.click();
  URL.revokeObjectURL(link.href);

  dogSays("Backup saved. I buried it safely 🦴");
}

// A function that checks one task from a file and fixes anything missing
// (it returns null if the task can't be used at all)
function cleanTask(task) {
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

  // Only allow the four lists we know. Old backups have no list: use "next"
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

// A function that adds the tasks from a backup file to the list (MERGE)
function restoreTasks(fileText) {
  // Try to read the file. If it isn't a list of tasks, stop and tell the user
  let fileTasks;
  try {
    fileTasks = JSON.parse(fileText);
  } catch (error) {
    dogSays("Hmm, I can't read that file 🤔");
    return;
  }

  if (!Array.isArray(fileTasks)) {
    dogSays("That's not a task backup 🤔");
    return;
  }

  // Make a list of the tasks we already have, so we can skip duplicates.
  // A task counts as a duplicate if it has the same text AND the same due date
  const existingTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const alreadyHave = existingTasks.map(function (task) {
    return task.text + "|" + task.dueDate;
  });

  let addedCount = 0;

  fileTasks.forEach(function (fileTask) {
    const task = cleanTask(fileTask);
    if (task === null) {
      return;   // broken task: skip it
    }

    const key = task.text + "|" + task.dueDate;
    if (alreadyHave.includes(key)) {
      return;   // we already have this task: skip it
    }

    createTask(task.text, task.done, task.dueDate, task.priority, task.status, task.focus);
    alreadyHave.push(key);   // so the same task in the file isn't added twice
    addedCount = addedCount + 1;
  });

  // Save everything, update the counts and filters, and let the dog react
  saveTasks();
  applyFilter();

  if (addedCount === 0) {
    dogSays("You already have all these tasks 👍");
  } else if (addedCount === 1) {
    dogSays("1 task is back. Woof 🐶");
  } else {
    dogSays(addedCount + " tasks are back. Woof 🐶");
  }
}

// Download button: save the backup file
downloadButton.addEventListener("click", downloadTasks);

// Restore button: open the hidden file picker
restoreButton.addEventListener("click", function () {
  restoreInput.click();
});

// When a file is chosen, read it, then restore the tasks inside it
restoreInput.addEventListener("change", function () {
  const chosenFile = restoreInput.files[0];
  if (!chosenFile) {
    return;   // the user closed the picker without choosing
  }

  // FileReader reads a file from your computer as text
  const reader = new FileReader();
  reader.onload = function () {
    restoreTasks(reader.result);
  };
  reader.readAsText(chosenFile);

  // Empty the picker, so choosing the same file again still works
  restoreInput.value = "";
});


// STEP 4: When the page opens, bring back any saved tasks
loadTasks();
updateCounter();

// Show today's date above the title, e.g. "Sunday, 1 November"
const todayLabel = document.getElementById("today");
todayLabel.textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

// ---------- THE DOG 🐶 ----------
const mascot = document.getElementById("mascot");
const dogDrawing = document.getElementById("dog-drawing");
const bubble = document.getElementById("dog-bubble");

// Things the dog might say when you click it
const dogLines = [
  "Woof. You've got this",
  "Good human 🦴",
  "One task at a time",
  "Belly rubs after this list?",
  "*happy tail noises*",
  "I believe in you",
  "Walk later? Tasks first."
];

// A timer, so the bubble disappears a couple of seconds after the dog talks
let bubbleTimer;

// A function that makes the dog say something and hop
function dogSays(message) {
  bubble.textContent = message;
  bubble.classList.add("show");
  mascot.classList.add("hop");

  // If the dog was already talking, restart the countdown
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(function () {
    bubble.classList.remove("show");
    mascot.classList.remove("hop");
  }, 2200);
}

// Clicking the dog: it says something random
mascot.addEventListener("click", function () {
  const randomIndex = Math.floor(Math.random() * dogLines.length);
  dogSays(dogLines[randomIndex]);
});

// A function that sends a copy of the dog running across the bottom of the screen
function runDog() {
  const runner = document.createElement("div");
  runner.className = "dog-runner";
  // Copy the dog drawing (and remove the copy's id, because ids must be unique)
  const dogCopy = dogDrawing.cloneNode(true);
  dogCopy.removeAttribute("id");
  runner.appendChild(dogCopy);
  document.body.appendChild(runner);

  // Remove the runner once it has left the screen
  setTimeout(function () {
    runner.remove();
  }, 2800);
}

// Paw prints: when you finish a task, 3 little paws walk away from its checkbox
function pawPrints(x, y) {
  for (let step = 0; step < 3; step++) {
    const paw = document.createElement("span");
    paw.className = "paw-print";
    paw.appendChild(makeIcon("paw"));

    // Each paw is a bit further right, and they zig-zag up and down like real steps
    paw.style.left = x + 24 + step * 24 + "px";
    paw.style.top = y + (step % 2 === 0 ? -6 : 6) + "px";
    paw.style.animationDelay = step * 120 + "ms";
    document.body.appendChild(paw);

    setTimeout(function () {
      paw.remove();
    }, 1200);
  }
}

// ---------- THE DOG COACH 🐶 (helps you sort and review, the GTD way) ----------
const coach = document.getElementById("coach");
const coachStepLabel = document.getElementById("coach-step");
const coachQuestion = document.getElementById("coach-question");
const coachBody = document.getElementById("coach-body");
const coachAnswers = document.getElementById("coach-answers");

// Put a small copy of the dog in the coach's corner
const coachDog = dogDrawing.cloneNode(true);
coachDog.removeAttribute("id");
document.getElementById("coach-dog").appendChild(coachDog);

// ...and a tiny one next to the app's name at the top of the sidebar
const brandDog = dogDrawing.cloneNode(true);
brandDog.removeAttribute("id");
document.getElementById("brand-dog").appendChild(brandDog);

// A function that closes the coach (the Esc key also closes it, by itself)
function closeCoach() {
  coach.close();
}

document.getElementById("coach-close").addEventListener("click", closeCoach);

// A function that shows one question in the coach, with answer buttons.
// answers is a list like: [{ label: "Yes", main: true, action: someFunction }]
function askCoach(stepText, question, answers) {
  coachStepLabel.textContent = stepText;
  coachQuestion.textContent = question;

  // Empty the middle part (the step can fill it in after) and the old answers
  coachBody.innerHTML = "";
  coachAnswers.innerHTML = "";

  answers.forEach(function (answer) {
    coachAnswers.appendChild(makeCoachButton(answer.label, answer.main, answer.action));
  });

  // Open the pop-up, if it isn't open already
  if (!coach.open) {
    coach.showModal();
  }
}

// A function that makes one answer button
function makeCoachButton(label, isMain, action) {
  const button = document.createElement("button");
  button.className = "coach-answer";
  if (isMain) {
    button.classList.add("main");   // the main answer is butter-yellow
  }
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

// A function that adds a line of text to the middle of the coach
function addCoachText(text, className) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  coachBody.appendChild(paragraph);
}

// A function that adds a list of tasks to the middle of the coach
// (or a friendly note when there are none)
function addCoachList(tasks, emptyText) {
  if (tasks.length === 0) {
    addCoachText(emptyText, "coach-note");
    return null;
  }

  const list = document.createElement("ul");
  list.className = "coach-list";
  tasks.forEach(function (task) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = getTaskText(task);
    item.appendChild(text);

    // Show the due date too, if there is one
    if (task.dataset.dueDate) {
      const date = document.createElement("small");
      date.className = "due-date";
      showDueDate(date, task.dataset.dueDate);
      item.appendChild(date);
    }
    list.appendChild(item);
  });
  coachBody.appendChild(list);
  return list;
}

// A function that adds a text box to the middle of the coach.
// Pressing Enter in it runs onEnter
function addCoachInput(value, placeholder, onEnter) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "coach-input";
  input.value = value;
  input.placeholder = placeholder;
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      onEnter();
    }
  });
  coachBody.appendChild(input);
  input.focus();
  return input;
}

// Small helpers: read a task's text, move a task to another list, find unfinished tasks in a list
function getTaskText(listItem) {
  return listItem.querySelector(".task-text").textContent;
}

function moveTask(listItem, listKey) {
  listItem.dataset.status = listKey;
  listItem.querySelector(".status-select").value = listKey;
}

function tasksInList(listKey) {
  return Array.from(taskList.querySelectorAll('li[data-status="' + listKey + '"]'));
}

// ---------- SORT MY INBOX: the dog asks about each inbox task, one at a time ----------
//
//   Can you act on it?
//   ├─ No  → 🌙 Someday, or let it go (delete)
//   └─ Yes → What's the very next step? → Under 2 minutes?
//            ├─ Yes → Do it now! → ✅ Done
//            └─ No  → Who does it? → Me: ▶ Next · Someone else: ⏳ Waiting
//
let sortQueue = [];   // the inbox tasks still waiting to be sorted
let sortTotal = 0;
let sortInput;        // the "next step" text box

function startSorting() {
  sortQueue = tasksInList("inbox");
  sortTotal = sortQueue.length;

  if (sortTotal === 0) {
    askCoach("Sort my inbox", "Your inbox is empty. Nothing to sort 🐶", [
      { label: "Yay", main: true, action: closeCoach }
    ]);
    return;
  }

  askActionable();
}

// The label at the top, e.g. "Sorting task 2 of 5"
function sortLabel() {
  return "Sorting task " + (sortTotal - sortQueue.length + 1) + " of " + sortTotal;
}

// QUESTION 1: is it actionable?
function askActionable() {
  askCoach(sortLabel(), "Is this something you can act on?", [
    { label: "Yes", main: true, action: askNextStep },
    { label: "No", action: askNotActionable },
    { label: "Skip for now", action: finishSortingTask }
  ]);
  addCoachText(getTaskText(sortQueue[0]), "coach-task");
}

// Not actionable: keep it for someday, or let it go
function askNotActionable() {
  askCoach(sortLabel(), "Not for now? Keep it for someday, or let it go?", [
    { label: "Someday", main: true, action: function () {
      moveTask(sortQueue[0], "someday");
      finishSortingTask();
    } },
    { label: "Let it go", action: function () {
      sortQueue[0].remove();
      finishSortingTask();
    } },
    { label: "← Back", action: askActionable }
  ]);
  addCoachText(getTaskText(sortQueue[0]), "coach-task");
}

// QUESTION 2: what's the very next small step? (you can rewrite the task)
function askNextStep() {
  askCoach(sortLabel(), "What's the very next small step?", [
    { label: "Next →", main: true, action: saveNextStep },
    { label: "← Back", action: askActionable }
  ]);
  addCoachText("Make it something you can actually do, like \"Text Sam about Saturday\".", "coach-note");
  sortInput = addCoachInput(getTaskText(sortQueue[0]), "The next step…", saveNextStep);
}

// Save the rewritten step (if the box isn't empty), then ask the next question
function saveNextStep() {
  const newText = sortInput.value.trim();
  if (newText !== "") {
    showTaskText(sortQueue[0].querySelector(".task-text"), newText);
  }
  askTwoMinutes();
}

// QUESTION 3: the two-minute rule
function askTwoMinutes() {
  askCoach(sortLabel(), "Can you do it in under 2 minutes?", [
    { label: "Yes", main: true, action: askDoItNow },
    { label: "No", action: askWho },
    { label: "← Back", action: askNextStep }
  ]);
  addCoachText(getTaskText(sortQueue[0]), "coach-task");
}

// Under 2 minutes: do it right now!
function askDoItNow() {
  askCoach(sortLabel(), "Then do it now. I'll wait right here 🐶", [
    { label: "I did it", main: true, action: function () {
      const task = sortQueue[0];
      moveTask(task, "next");   // so it isn't back in the inbox if you untick it later
      task.querySelector('input[type="checkbox"]').click();   // tick it: moves to Done, the dog runs
      finishSortingTask();
    } },
    { label: "Later, actually", action: askWho }
  ]);
  addCoachText(getTaskText(sortQueue[0]), "coach-task");
}

// QUESTION 4: who does the next step?
function askWho() {
  askCoach(sortLabel(), "Who does the next step?", [
    { label: "Me", main: true, action: function () {
      moveTask(sortQueue[0], "next");
      finishSortingTask();
    } },
    { label: "Someone else", action: function () {
      moveTask(sortQueue[0], "waiting");
      finishSortingTask();
    } }
  ]);
  addCoachText(getTaskText(sortQueue[0]), "coach-task");
}

// This task is sorted: save, then go to the next one (or finish)
function finishSortingTask() {
  sortQueue.shift();   // take the first task off the queue
  saveTasks();
  applyFilter();

  if (sortQueue.length > 0) {
    askActionable();
    return;
  }

  // All done! Skipped tasks are still in the inbox, and that's fine
  const leftInInbox = tasksInList("inbox").length;
  if (leftInInbox === 0) {
    runDog();
    askCoach("All sorted", "Inbox zero. Best human ever 🎉", [
      { label: "Close", main: true, action: closeCoach }
    ]);
  } else {
    askCoach("All sorted", "All done for now. Good work 🐾", [
      { label: "Close", main: true, action: closeCoach }
    ]);
    addCoachText(leftInInbox + " skipped " + (leftInInbox === 1 ? "task is" : "tasks are") + " still in the inbox, ready for next time.", "coach-note");
  }
}

// ---------- WEEKLY REVIEW: the dog walks you through your lists ----------
// Every step can be skipped. The dog only cheers, it never scolds
const REVIEW_STEPS = [
  reviewCelebrate,
  reviewBrainDump,
  reviewComingUp,
  reviewNextList,
  reviewWaitingList,
  reviewProjects,
  reviewSomeday,
  reviewFinish
];
let reviewIndex = 0;

function startReview() {
  reviewIndex = 0;
  REVIEW_STEPS[reviewIndex]();
}

// Go forward (+1) or back (-1) one step
function reviewMove(step) {
  reviewIndex = reviewIndex + step;
  REVIEW_STEPS[reviewIndex]();
}

// The label at the top, e.g. "Weekly review, step 3 of 8"
function reviewLabel() {
  return "Weekly review, step " + (reviewIndex + 1) + " of " + REVIEW_STEPS.length;
}

// The usual "← Back" and "Next →" buttons
function reviewAnswers() {
  const answers = [];
  if (reviewIndex > 0) {
    answers.push({ label: "← Back", action: function () { reviewMove(-1); } });
  }
  answers.push({ label: "Next →", main: true, action: function () { reviewMove(1); } });
  return answers;
}

// STEP 1: celebrate what's done
function reviewCelebrate() {
  const doneCount = doneList.querySelectorAll("li").length;
  let question = "A fresh start. Let's get clear together 🐾";
  if (doneCount > 0) {
    question = "You've finished " + doneCount + (doneCount === 1 ? " task" : " tasks") + ". Good human 🦴";
  }
  askCoach(reviewLabel(), question, reviewAnswers());
  addCoachText("We'll look at each list, one at a time. Skip anything you like.", "coach-note");
}

// STEP 2: empty your head into the inbox
function reviewBrainDump() {
  askCoach(reviewLabel(), "Anything on your mind? Pop it in the inbox.", reviewAnswers());
  addCoachText("Type one thing, press Enter, repeat. Calls, errands, ideas, worries…", "coach-note");

  const added = document.createElement("ul");
  added.className = "coach-list";

  const input = addCoachInput("", "e.g. Call the dentist", function () {
    const text = input.value.trim();
    if (text === "") {
      return;
    }
    createTask(text, false, "", "medium", "inbox", false);
    saveTasks();
    applyFilter();

    // Show it in the coach, so you can see what you added
    const item = document.createElement("li");
    item.textContent = text;
    added.appendChild(item);
    input.value = "";
  });

  coachBody.appendChild(added);
}

// STEP 3: dates coming up in the next 2 weeks (and anything overdue)
function reviewComingUp() {
  const later = new Date();
  later.setDate(later.getDate() + 14);
  const inTwoWeeks = later.toLocaleDateString("en-CA");   // "YYYY-MM-DD", like our due dates

  const comingUp = Array.from(taskList.querySelectorAll("li")).filter(function (task) {
    return task.dataset.dueDate !== "" && task.dataset.dueDate <= inTwoWeeks;
  });

  // Earliest date first
  comingUp.sort(function (a, b) {
    return a.dataset.dueDate < b.dataset.dueDate ? -1 : 1;
  });

  askCoach(reviewLabel(), "Here's what's coming up in the next 2 weeks.", reviewAnswers());
  addCoachList(comingUp, "Nothing with a date soon. Calm skies ☁️");
}

// STEP 4: the Next list
function reviewNextList() {
  askCoach(reviewLabel(), "Your Next list. Still the right steps?", reviewAnswers());
  addCoachText("Finished one? Tick it off after the review. Feels too big? Make it smaller.", "coach-note");
  addCoachList(tasksInList("next"), "No next steps right now. That's okay 🐾");
}

// STEP 5: the Waiting list
function reviewWaitingList() {
  askCoach(reviewLabel(), "Waiting on anyone? Maybe send a friendly nudge.", reviewAnswers());
  addCoachList(tasksInList("waiting"), "Not waiting on anyone. Lovely 🐾");
}

// STEP 6: every project should have at least one next step
function reviewProjects() {
  askCoach(reviewLabel(), "Does every project have a next step?", reviewAnswers());

  // Find all projects in unfinished tasks
  const projects = [];
  taskList.querySelectorAll("li").forEach(function (task) {
    findTags(getTaskText(task), "#").forEach(function (project) {
      if (!projects.includes(project)) {
        projects.push(project);
      }
    });
  });

  if (projects.length === 0) {
    addCoachText("No projects yet. Tip: add #something to tasks that belong together, like #garden.", "coach-note");
    return;
  }

  const list = document.createElement("ul");
  list.className = "coach-list";
  projects.sort().forEach(function (project) {
    // Count this project's tasks in the Next list
    const nextCount = tasksInList("next").filter(function (task) {
      return findTags(getTaskText(task), "#").includes(project);
    }).length;

    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = project;
    const note = document.createElement("small");
    if (nextCount === 0) {
      note.textContent = "needs a next step";
    } else {
      note.textContent = nextCount + (nextCount === 1 ? " next step" : " next steps");
    }
    item.appendChild(name);
    item.appendChild(note);
    list.appendChild(item);
  });
  coachBody.appendChild(list);
}

// STEP 7: Someday ideas, with a button to start one
function reviewSomeday() {
  askCoach(reviewLabel(), "Someday ideas. Ready to start any of these?", reviewAnswers());

  const somedayTasks = tasksInList("someday");
  const list = addCoachList(somedayTasks, "No someday ideas yet. Dream a little 🌙");
  if (list === null) {
    return;
  }

  // Add a "Start" button to each idea: it moves the task to Next
  somedayTasks.forEach(function (task, index) {
    const startButton = makeCoachButton("Start", false, function () {
      moveTask(task, "next");
      saveTasks();
      applyFilter();
      startButton.textContent = "Moved";
      startButton.disabled = true;
    });
    list.children[index].appendChild(startButton);
  });
}

// STEP 8: all done!
function reviewFinish() {
  runDog();
  const inboxCount = tasksInList("inbox").length;

  if (inboxCount > 0) {
    askCoach(reviewLabel(), "Review done. Your mind is clear 🎉", [
      { label: "← Back", action: function () { reviewMove(-1); } },
      { label: "Sort my inbox", main: true, action: startSorting },
      { label: "Close", action: closeCoach }
    ]);
    if (inboxCount === 1) {
      addCoachText("You have 1 thing in your inbox. Want to sort it now?", "coach-note");
    } else {
      addCoachText("You have " + inboxCount + " things in your inbox. Want to sort them now?", "coach-note");
    }
  } else {
    askCoach(reviewLabel(), "Review done. Your mind is clear 🎉", [
      { label: "← Back", action: function () { reviewMove(-1); } },
      { label: "Close", main: true, action: closeCoach }
    ]);
  }
}

// The two dog coach buttons in the sidebar
document.getElementById("sort-button").addEventListener("click", startSorting);
document.getElementById("review-button").addEventListener("click", startReview);
