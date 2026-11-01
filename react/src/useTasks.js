// THE TASKS: one list that holds every task, plus the only functions allowed to change it.
//
// This is the biggest idea in React. In the plain version, the PAGE was the data:
// saveTasks() read every <li> to find out what the tasks were.
// In React it's the other way round: this list is the truth, and the page is drawn from it.
// Change the list, and React redraws whatever changed by itself.
import { useEffect, useState } from "react";
import { cleanTask, monthDay, newId, nextDueDate } from "./tasks.js";

// Every task has a permanent id (saved with it), so React, Undo, repeats and Restore always
// know exactly which task is which. Two saved tasks must never share one: a repeat gets a new id
function uniqueIds(tasks) {
  const seen = [];
  return tasks.map(function (task) {
    const fixed = seen.includes(task.id) ? { ...task, id: newId() } : task;
    seen.push(fixed.id);
    return fixed;
  });
}

// Read the saved tasks, SAFELY.
// If the saved text is damaged, it is copied aside (under "tasks-damaged") BEFORE anything can
// be saved over it, so it can still be recovered. If even that copy fails, saving stays switched
// off ("locked"), so the damaged tasks are never overwritten
function loadTasks() {
  let text = null;
  try {
    text = localStorage.getItem("tasks");
    const saved = JSON.parse(text) || [];   // no saved tasks yet: an empty list
    return { tasks: uniqueIds(saved.map(cleanTask).filter(Boolean)), problem: "" };
  } catch (error) {
    try {
      localStorage.setItem("tasks-damaged", text);
      return { tasks: [], problem: "damaged" };
    } catch (copyError) {
      return { tasks: [], problem: "locked" };
    }
  }
}

// A HOOK: a function whose name starts with "use", that gives a component some memory.
// Any component can call useTasks() and get the tasks plus the functions that change them
export function useTasks() {
  // useState(loadTasks) runs loadTasks only once, at the start
  const [start] = useState(loadTasks);
  const [tasks, setTasks] = useState(start.tasks);
  // A storage problem the app should tell you about: { kind, time } or null.
  // (time makes every new problem a NEW value, so the app notices each one)
  const [storageProblem, setStorageProblem] = useState(start.problem ? { kind: start.problem, time: Date.now() } : null);

  // useEffect: "after the page is drawn, do this". The [tasks] at the end means:
  // only when the tasks have changed. So every change is saved, and we never call saveTasks() by hand
  useEffect(
    function () {
      if (start.problem === "locked") {
        return;   // never save over damaged tasks that couldn't be copied aside
      }
      // Save unfinished tasks first, then finished ones (the same order as the plain version)
      const inOrder = tasks.filter((task) => !task.done).concat(tasks.filter((task) => task.done));
      try {
        localStorage.setItem("tasks", JSON.stringify(inOrder));
      } catch (error) {
        // The browser's storage is full or blocked: tell the app instead of crashing
        setStorageProblem({ kind: "save-failed", time: Date.now() });
      }
    },
    [tasks, start.problem]
  );

  // RULE: never change the list itself. Always make a NEW list with the change in it.
  // That's how React notices something changed (it compares the old list with the new one)

  function addTask(text, dueDate, priority, status, repeat = "", notes = "", steps = []) {
    const task = { text, done: false, dueDate, priority, status, focus: false, repeat, notes, steps, id: newId(), nextId: "", repeatDay: 0 };
    // setTasks with a function: "take the newest list and give back a new one"
    setTasks((old) => [...old, task]);   // [...old, task] = all the old tasks, then the new one
  }

  // Change some parts of one task, e.g. updateTask(id, { status: "next" })
  function updateTask(id, changes) {
    setTasks((old) =>
      old.map(function (task) {
        if (task.id !== id) {
          return task;
        }
        const updated = { ...task, ...changes };
        // A new date or repeat: a monthly repeat starts again from the new date's day
        if (updated.dueDate !== task.dueDate || updated.repeat !== task.repeat) {
          updated.repeatDay = 0;
        }
        return updated;
      })
    );
  }

  // Tick or untick a task. It moves to the end, so it lands at the bottom of its new section
  function toggleDone(id) {
    setTasks(function (old) {
      const task = old.find((task) => task.id === id);
      const others = old.filter((task) => task.id !== id);
      const changed = { ...task, done: !task.done };
      if (!task.repeat) {
        return [...others, changed];
      }
      if (changed.done) {
        // A repeating task was ticked: a fresh copy with its own id and the next date (without
        // the star: Today's focus is chosen each day), and its steps all unticked again.
        // The ticked task remembers the copy's id (nextId), so unticking removes exactly that copy
        const copy = {
          ...task,
          id: newId(),
          nextId: "",
          dueDate: nextDueDate(task),
          focus: false,
          steps: task.steps.map((step) => ({ ...step, done: false })),
          repeatDay: task.repeat === "monthly" ? monthDay(task) : 0
        };
        return [...others, { ...changed, nextId: copy.id }, copy];
      }
      // It was unticked: take its fresh copy away again (unless that copy was finished too)
      const isItsCopy = (other) => other.id === task.nextId && !other.done;
      return [...others.filter((other) => !isItsCopy(other)), { ...changed, nextId: "" }];
    });
  }

  function deleteTask(id) {
    setTasks((old) => old.filter((task) => task.id !== id));
  }

  // Put a deleted task back at its old place (for Undo).
  // slice(0, index) = the tasks before it, slice(index) = the tasks after it
  function restoreTask(task, index) {
    setTasks((old) => [...old.slice(0, index), task, ...old.slice(index)]);
  }

  // Add many tasks at once (for Restore). They must already be checked by cleanTask
  function addTasks(newTasks) {
    setTasks((old) => uniqueIds([...old, ...newTasks]));
  }

  return { tasks, storageProblem, addTask, updateTask, toggleDone, deleteTask, restoreTask, addTasks };
}
