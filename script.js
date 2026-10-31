// STEP 1: Find the parts of the page we need to work with
const taskInput = document.getElementById("task-input");
const addButton = document.getElementById("add-button");
const taskList = document.getElementById("task-list");   // the "To do" list
const doneList = document.getElementById("done-list");   // the "Done" list
const dateInput = document.getElementById("date-input");
const priorityInput = document.getElementById("priority-input");


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
function createTask(taskText, isDone, dueDate, priority) {
  // Create a new list item to hold the task
  const listItem = document.createElement("li");

  // Create the text part of the task
  const textSpan = document.createElement("span");
  textSpan.textContent = taskText;

  
  // Remember this task's due date and priority (data- notes, like the filter buttons)
  listItem.dataset.dueDate = dueDate || "";
  listItem.dataset.priority = priority || "medium";

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

    if (checkbox.checked) {
      doneList.appendChild(listItem);   // ticked: move to Done
    } else {
      taskList.appendChild(listItem);   // unticked: move back to To do
    }

    saveTasks();
    applyFilter();

    // Reward a finished task: a dog runs across the screen
    if (checkbox.checked) {
      runDog();
      if (taskList.children.length === 0) {
        dogSays("ALL DONE! Best human ever! 🎉");
      } else {
        dogSays("Nice one! 🐾");
      }
    }
  });

    // Create an Edit button for this task
  const editButton = document.createElement("button");
  editButton.textContent = "✎";
  editButton.title = "Edit task";
  editButton.className = "edit-button";

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

      editButton.textContent = "✓";
    } else {
      // SAVE: don't allow an empty task
      const newText = editTextInput.value.trim();
      if (newText === "") {
        return;
      }

      // Update the task with the new text and date
      textSpan.textContent = newText;
      listItem.dataset.dueDate = editDateInput.value;
      showDueDate(dateLabel, editDateInput.value);

      // Hide the edit boxes, show the normal text and date again
      editTextInput.style.display = "none";
      editDateInput.style.display = "none";
      textSpan.style.display = "";
      dateLabel.style.display = "";

      editButton.textContent = "✎";
      saveTasks();
    }
  });



  // Create a Delete button for this task
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "🗑";
  deleteButton.title = "Delete task";
  deleteButton.className = "delete-button";

  // When Delete is clicked, remove this task from the list
  deleteButton.addEventListener("click", function () {
    listItem.remove();
    saveTasks();
  });

  // Put the text and the button inside the list item
  listItem.appendChild(checkbox);
  listItem.appendChild(textSpan);
  listItem.appendChild(editTextInput);
  listItem.appendChild(dateLabel);
  listItem.appendChild(editDateInput);
  listItem.appendChild(editButton);
  listItem.appendChild(deleteButton);




  // Put the list item into the right section: finished tasks go to Done
  if (isDone) {
    doneList.appendChild(listItem);
  } else {
    taskList.appendChild(listItem);
  }
}

// A function that reads the text box and adds a new task
function addTask() {
  // Get what the user typed, and remove extra spaces at the start/end
  const taskText = taskInput.value.trim();

  // If the box is empty, do nothing
  if (taskText === "") {
    return;
  }

  // Build the task (not done yet), then save
  createTask(taskText, false, dateInput.value, priorityInput.value);
  saveTasks();
  applyFilter();
  dogSays("Got it! Added to the list. 🐶");

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
      text: listItem.querySelector("span").textContent,
      done: listItem.querySelector("input").checked,
      dueDate: listItem.dataset.dueDate,
      priority: listItem.dataset.priority
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
  createTask(task.text, task.done, task.dueDate, task.priority);

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

// Remember which filter is chosen: "all", "active", "done", "high", "medium" or "low"
let currentFilter = "all";

const todoSection = document.getElementById("todo-section");
const doneSection = document.getElementById("done-section");

// A function that shows or hides sections and tasks based on the chosen filter
function applyFilter() {
  // 1. Show or hide whole sections
  if (currentFilter === "active") {
    todoSection.style.display = "";
    doneSection.style.display = "none";   // only unfinished tasks
  } else if (currentFilter === "done") {
    todoSection.style.display = "none";   // only finished tasks
    doneSection.style.display = "";
  } else {
    todoSection.style.display = "";
    doneSection.style.display = "";
  }

  // 2. For a priority filter, hide tasks with a different priority
  const isPriorityFilter = currentFilter === "high" || currentFilter === "medium" || currentFilter === "low";

  document.querySelectorAll(".task-list li").forEach(function (listItem) {
    if (isPriorityFilter && listItem.dataset.priority !== currentFilter) {
      listItem.style.display = "none";   // hide: different priority
    } else {
      listItem.style.display = "";       // show the task
    }
  });
}

// When a filter button is clicked...
const filterButtons = document.querySelectorAll(".filter-button");
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // ...remember which filter was chosen (read from data-filter)
    currentFilter = button.dataset.filter;

    // ...make only this button look chosen
    filterButtons.forEach(function (otherButton) {
      otherButton.classList.remove("active");
    });
    button.classList.add("active");

    // ...and show or hide the tasks
    applyFilter();
  });
});

// DARK MODE: the button switches between light and dark
const themeButton = document.getElementById("theme-button");

// A function that turns dark mode on (true) or off (false)
function setDarkMode(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    themeButton.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeButton.textContent = "🌙";
  }

  // Remember the choice for next time
  localStorage.setItem("darkMode", isDark);
}

// When the button is clicked, switch to the opposite mode
themeButton.addEventListener("click", function () {
  const isDarkNow = document.body.classList.contains("dark");
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

  // Numbers next to the section titles, e.g. "(3)"
  document.getElementById("todo-count").textContent = "(" + active + ")";
  document.getElementById("done-count").textContent = "(" + done + ")";

  // The progress bar and the line under it
  if (total === 0) {
    taskCounter.textContent = "No tasks yet ✨";
    progressFill.style.width = "0%";
  } else {
    const percent = Math.round((done / total) * 100);
    taskCounter.textContent = done + " of " + total + " done · " + percent + "%";
    progressFill.style.width = percent + "%";
  }
}


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
  "Woof! You've got this.",
  "Good human! 🦴",
  "One task at a time.",
  "Belly rubs after this list?",
  "*happy tail noises*",
  "I believe in you!",
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

// Paw prints: wherever you click, a 🐾 appears and fades away
document.addEventListener("click", function (event) {
  const paw = document.createElement("span");
  paw.className = "paw-print";
  paw.textContent = "🐾";
  paw.style.left = event.clientX + "px";
  paw.style.top = event.clientY + "px";
  document.body.appendChild(paw);

  setTimeout(function () {
    paw.remove();
  }, 800);
});
