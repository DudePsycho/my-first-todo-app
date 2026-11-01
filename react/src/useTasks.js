// THE TASKS: one list that holds every task, plus the only functions allowed to change it.
//
// This is the biggest idea in React. In the plain version, the PAGE was the data:
// saveTasks() read every <li> to find out what the tasks were.
// In React it's the other way round: this list is the truth, and the page is drawn from it.
// Change the list, and React redraws whatever changed by itself.
import { useEffect, useState } from "react";
import { cleanTask, nextDueDate } from "./tasks.js";

// React needs a name tag (an id) for each task, to know which card is which when the list changes.
// The ids live only in memory: the saved data looks exactly like the plain version's
let lastId = 0;
function giveId(task) {
  lastId = lastId + 1;
  return { ...task, id: lastId };   // { ...task } copies every part of the task, then adds the id
}

// Read the saved tasks. If the saved data is damaged, start with an empty list instead of crashing
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem("tasks")) || [];
    return saved.map(cleanTask).filter(Boolean).map(giveId);   // filter(Boolean) drops the nulls
  } catch (error) {
    return [];
  }
}

// A HOOK: a function whose name starts with "use", that gives a component some memory.
// Any component can call useTasks() and get the tasks plus the functions that change them
export function useTasks() {
  // useState gives us [the value, a function to change it]. loadTasks runs only once, at the start
  const [tasks, setTasks] = useState(loadTasks);

  // useEffect: "after the page is drawn, do this". The [tasks] at the end means:
  // only when the tasks have changed. So every change is saved, and we never call saveTasks() by hand
  useEffect(
    function () {
      // Save unfinished tasks first, then finished ones (the same order as the plain version),
      // without the ids
      const inOrder = tasks.filter((task) => !task.done).concat(tasks.filter((task) => task.done));
      const toSave = inOrder.map(function ({ id, ...task }) {
        return task;
      });
      localStorage.setItem("tasks", JSON.stringify(toSave));
    },
    [tasks]
  );

  // RULE: never change the list itself. Always make a NEW list with the change in it.
  // That's how React notices something changed (it compares the old list with the new one)

  function addTask(text, dueDate, priority, status, repeat = "") {
    const task = giveId({ text, done: false, dueDate, priority, status, focus: false, repeat });
    // setTasks with a function: "take the newest list and give back a new one"
    setTasks((old) => [...old, task]);   // [...old, task] = all the old tasks, then the new one
  }

  // Change some parts of one task, e.g. updateTask(5, { status: "next" })
  function updateTask(id, changes) {
    setTasks((old) => old.map((task) => (task.id === id ? { ...task, ...changes } : task)));
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
        // A repeating task was ticked: a fresh copy with the next date (without the star:
        // Today's focus is chosen each day)
        return [...others, changed, giveId({ ...task, dueDate: nextDueDate(task), focus: false })];
      }
      // It was unticked: take its fresh copy away again, so there are no doubles
      const copy = others.find((other) => !other.done && other.text === task.text && other.repeat === task.repeat);
      return [...others.filter((other) => other !== copy), changed];
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
    setTasks((old) => [...old, ...newTasks.map(giveId)]);
  }

  return { tasks, addTask, updateTask, toggleDone, deleteTask, restoreTask, addTasks };
}
