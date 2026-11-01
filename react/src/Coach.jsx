// THE DOG COACH: a pop-up where the dog asks questions one at a time.
// The plain version had one function per question, and each one rewrote the pop-up.
// In React, the coach remembers WHICH question it's on (a "step"), and draws that question.
// Answering a question just changes the step
import { useEffect, useRef, useState } from "react";
import Dog from "./Dog.jsx";
import Icon from "./Icon.jsx";
import { DueDate } from "./TaskItem.jsx";
import { dateString, findTags } from "./tasks.js";

// The frame every question shares: the dog, the step label, the question, the answer buttons.
// answers is a list like: [{ label: "Yes", main: true, action: someFunction }]
function CoachStep({ label, question, answers, onClose, children }) {
  return (
    <>
      <div className="coach-top">
        <div className="coach-dog"><Dog /></div>
        <p className="coach-step">{label}</p>
        <button className="coach-close" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
      </div>
      <h2 className="coach-question">{question}</h2>
      {/* children = whatever is written between <CoachStep> and </CoachStep> */}
      <div className="coach-body">{children}</div>
      <div className="coach-answers">
        {answers.map((answer) => (
          <button key={answer.label} className={answer.main ? "coach-answer main" : "coach-answer"} onClick={answer.action}>
            {answer.label}
          </button>
        ))}
      </div>
    </>
  );
}

// A list of tasks inside the coach (or a friendly note when there are none).
// extra(task) can add something at the end of each row, like a Start button
function CoachList({ tasks, emptyText, extra }) {
  if (tasks.length === 0) {
    return <p className="coach-note">{emptyText}</p>;
  }
  return (
    <ul className="coach-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <span>{task.text}</span>
          {task.dueDate && <DueDate date={task.dueDate} />}
          {extra && extra(task)}
        </li>
      ))}
    </ul>
  );
}

// ---------- SORT MY INBOX: the dog asks about each inbox task, one at a time ----------
//
//   Can you act on it?
//   ├─ No  → 🌙 Someday, or delete it
//   └─ Yes → What's the very next step? → Under 2 minutes?
//            ├─ Yes → Do it now! → ✅ Done
//            └─ No  → Who does it? → Me: ▶ Next · Someone else: ⏳ Waiting
//
function SortInbox({ tasks, actions, onClose }) {
  // When sorting starts, remember which tasks were in the inbox (by id). This runs only once
  const [queue] = useState(() => tasks.filter((task) => !task.done && task.status === "inbox").map((task) => task.id));
  const [position, setPosition] = useState(0);         // which task of the queue we're on
  const [step, setStep] = useState("actionable");      // which question we're on
  const [nextStep, setNextStep] = useState("");        // the text in the "next step" box

  const isFinished = position >= queue.length;
  const leftInInbox = tasks.filter((task) => !task.done && task.status === "inbox").length;

  // When everything is sorted and the inbox is empty, the dog runs a victory lap
  useEffect(
    function () {
      if (queue.length > 0 && isFinished && leftInInbox === 0) {
        actions.runDog();
      }
    },
    [isFinished]
  );

  if (queue.length === 0) {
    return <CoachStep label="Sort my inbox" question="Your inbox is empty. Nothing to sort" answers={[{ label: "Close", main: true, action: onClose }]} onClose={onClose} />;
  }

  if (isFinished) {
    if (leftInInbox === 0) {
      return <CoachStep label="All sorted" question="All sorted. Your inbox is empty" answers={[{ label: "Close", main: true, action: onClose }]} onClose={onClose} />;
    }
    return (
      <CoachStep label="All sorted" question="Sorting done" answers={[{ label: "Close", main: true, action: onClose }]} onClose={onClose}>
        <p className="coach-note">
          {leftInInbox} skipped {leftInInbox === 1 ? "task is" : "tasks are"} still in the inbox. Sort {leftInInbox === 1 ? "it" : "them"} next time.
        </p>
      </CoachStep>
    );
  }

  const id = queue[position];
  const task = tasks.find((task) => task.id === id);

  // If this task was deleted while the coach was open, skip straight to the next one
  // (React allows changing memory during drawing in this one way: it then simply draws again)
  if (!task) {
    setPosition(position + 1);
    return null;
  }

  const label = "Sorting task " + (position + 1) + " of " + queue.length;

  // This task is sorted: on to the next one
  function finishTask() {
    setPosition(position + 1);
    setStep("actionable");
  }

  function moveAndFinish(listKey) {
    actions.updateTask(id, { status: listKey });
    finishTask();
  }

  // Save the rewritten step (if the box isn't empty), then ask about the two minutes
  function saveNextStep() {
    if (nextStep.trim() !== "") {
      actions.updateTask(id, { text: nextStep.trim() });
    }
    setStep("twoMinutes");
  }

  function askNextStep() {
    setNextStep(task.text);
    setStep("nextStep");
  }

  // The task's text, shown in a dashed box under most questions
  const taskBox = <p className="coach-task">{task.text}</p>;

  if (step === "actionable") {
    return (
      <CoachStep label={label} question="Is this something you can act on?" onClose={onClose} answers={[
        { label: "Yes", main: true, action: askNextStep },
        { label: "No", action: () => setStep("notActionable") },
        { label: "Skip for now", action: finishTask }
      ]}>{taskBox}</CoachStep>
    );
  }

  if (step === "notActionable") {
    return (
      <CoachStep label={label} question="Not something to act on. Keep it for Someday, or delete it?" onClose={onClose} answers={[
        { label: "Someday", main: true, action: () => moveAndFinish("someday") },
        { label: "Delete", action: () => { actions.deleteTask(id); finishTask(); } },
        { label: "← Back", action: () => setStep("actionable") }
      ]}>{taskBox}</CoachStep>
    );
  }

  if (step === "nextStep") {
    return (
      <CoachStep label={label} question="What's the very next small step?" onClose={onClose} answers={[
        { label: "Next →", main: true, action: saveNextStep },
        { label: "← Back", action: () => setStep("actionable") }
      ]}>
        <p className="coach-note">Make it something you can actually do, like "Text Sam about Saturday".</p>
        <input
          type="text"
          className="coach-input"
          placeholder="The next step…"
          value={nextStep}
          onChange={(event) => setNextStep(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && saveNextStep()}
          autoFocus
        />
      </CoachStep>
    );
  }

  if (step === "twoMinutes") {
    return (
      <CoachStep label={label} question="Can you do it in under 2 minutes?" onClose={onClose} answers={[
        { label: "Yes", main: true, action: () => setStep("doItNow") },
        { label: "No", action: () => setStep("who") },
        { label: "← Back", action: askNextStep }
      ]}>{taskBox}</CoachStep>
    );
  }

  if (step === "doItNow") {
    return (
      <CoachStep label={label} question="Do it now, then come back and tick it off" onClose={onClose} answers={[
        // Move it to Next first, so it isn't back in the inbox if you untick it later
        { label: "I did it", main: true, action: () => { actions.updateTask(id, { status: "next" }); actions.completeTask(id); finishTask(); } },
        { label: "Later, actually", action: () => setStep("who") }
      ]}>{taskBox}</CoachStep>
    );
  }

  // The last question: who does the next step?
  return (
    <CoachStep label={label} question="Who does the next step?" onClose={onClose} answers={[
      { label: "Me", main: true, action: () => moveAndFinish("next") },
      { label: "Someone else", action: () => moveAndFinish("waiting") }
    ]}>{taskBox}</CoachStep>
  );
}

// ---------- WEEKLY REVIEW: the dog walks you through your lists ----------
// Every step can be skipped. The dog only cheers, it never scolds
const REVIEW_LENGTH = 8;

// Review step 2: empty your head into the inbox.
// It's its own component, so its memory (what you added) starts fresh each time you get here
function BrainDump({ actions }) {
  const [text, setText] = useState("");
  const [added, setAdded] = useState([]);

  function addOne() {
    if (text.trim() === "") {
      return;
    }
    actions.addTask(text.trim(), "", "medium", "inbox");
    setAdded([...added, text.trim()]);
    setText("");
  }

  return (
    <>
      <p className="coach-note">Type one thing, press Enter, repeat. Calls, errands, ideas, worries…</p>
      <input
        type="text"
        className="coach-input"
        placeholder="e.g. Call the dentist"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && addOne()}
        autoFocus
      />
      <ul className="coach-list">
        {added.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </>
  );
}

// Review step 7: Someday ideas, each with a Start button that moves it to Next
function SomedayIdeas({ tasks, actions }) {
  // Remember which ideas were shown, so a started one stays in the list (as "Moved")
  const [shownIds] = useState(() => tasks.filter((task) => !task.done && task.status === "someday").map((task) => task.id));
  const shown = tasks.filter((task) => shownIds.includes(task.id));

  return (
    <CoachList tasks={shown} emptyText="No someday ideas yet." extra={(task) => {
      const isMoved = task.status !== "someday";
      return (
        <button className="coach-answer" disabled={isMoved} onClick={() => actions.updateTask(task.id, { status: "next" })}>
          {isMoved ? "Moved" : "Start"}
        </button>
      );
    }} />
  );
}

function WeeklyReview({ tasks, actions, onClose, onSortInbox }) {
  const [index, setIndex] = useState(0);

  // The last step: the dog runs a victory lap
  useEffect(
    function () {
      if (index === REVIEW_LENGTH - 1) {
        actions.runDog();
      }
    },
    [index]
  );

  const label = "Weekly review, step " + (index + 1) + " of " + REVIEW_LENGTH;
  const todo = tasks.filter((task) => !task.done);
  const inList = (listKey) => todo.filter((task) => task.status === listKey);

  // The usual "← Back" and "Next →" buttons
  const answers = [];
  if (index > 0) {
    answers.push({ label: "← Back", action: () => setIndex(index - 1) });
  }
  answers.push({ label: "Next →", main: true, action: () => setIndex(index + 1) });

  const frame = { label, answers, onClose };   // the same props for every step, written once

  // STEP 1: what you finished, and what the review will do
  if (index === 0) {
    const doneCount = tasks.length - todo.length;
    const question = doneCount > 0
      ? "You've finished " + doneCount + (doneCount === 1 ? " task" : " tasks") + " so far. Now let's check your lists"
      : "Let's check your lists, one at a time";
    return (
      <CoachStep {...frame} question={question}>
        <p className="coach-note">8 short steps. Skip any step you like.</p>
      </CoachStep>
    );
  }

  // STEP 2: empty your head into the inbox
  if (index === 1) {
    return <CoachStep {...frame} question="Anything on your mind? Add it to the inbox."><BrainDump actions={actions} /></CoachStep>;
  }

  // STEP 3: dates coming up in the next 2 weeks (and anything overdue), earliest first
  if (index === 2) {
    const later = new Date();
    later.setDate(later.getDate() + 14);
    const inTwoWeeks = dateString(later);
    const comingUp = todo
      .filter((task) => task.dueDate !== "" && task.dueDate <= inTwoWeeks)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    return (
      <CoachStep {...frame} question="Here's what's coming up in the next 2 weeks.">
        <CoachList tasks={comingUp} emptyText="Nothing due in the next 2 weeks." />
      </CoachStep>
    );
  }

  // STEP 4: the Next list
  if (index === 3) {
    return (
      <CoachStep {...frame} question="Your Next list. Still the right steps?">
        <p className="coach-note">Finished one? Tick it off after the review. Feels too big? Make it smaller.</p>
        <CoachList tasks={inList("next")} emptyText="No next steps right now." />
      </CoachStep>
    );
  }

  // STEP 5: the Waiting list
  if (index === 4) {
    return (
      <CoachStep {...frame} question="Waiting on anyone? Follow up if it's been a while.">
        <CoachList tasks={inList("waiting")} emptyText="You're not waiting on anyone." />
      </CoachStep>
    );
  }

  // STEP 6: every project should have at least one next step
  if (index === 5) {
    const projects = [];
    todo.forEach((task) => {
      findTags(task.text, "#").forEach((project) => {
        if (!projects.includes(project)) {
          projects.push(project);
        }
      });
    });
    return (
      <CoachStep {...frame} question="Does every project have a next step?">
        {projects.length === 0 ? (
          <p className="coach-note">No projects yet. Tip: add #something to tasks that belong together, like #garden.</p>
        ) : (
          <ul className="coach-list">
            {projects.sort().map((project) => {
              const nextCount = inList("next").filter((task) => findTags(task.text, "#").includes(project)).length;
              return (
                <li key={project}>
                  <span>{project}</span>
                  <small>{nextCount === 0 ? "needs a next step" : nextCount + (nextCount === 1 ? " next step" : " next steps")}</small>
                </li>
              );
            })}
          </ul>
        )}
      </CoachStep>
    );
  }

  // STEP 7: Someday ideas
  if (index === 6) {
    return (
      <CoachStep {...frame} question="Someday ideas. Ready to start any of these?">
        <SomedayIdeas tasks={tasks} actions={actions} />
      </CoachStep>
    );
  }

  // STEP 8: the end, with a shortcut to sorting the inbox
  const inboxCount = inList("inbox").length;
  const back = { label: "← Back", action: () => setIndex(index - 1) };
  if (inboxCount > 0) {
    return (
      <CoachStep label={label} onClose={onClose} question="Review done" answers={[
        back,
        { label: "Sort my inbox", main: true, action: onSortInbox },
        { label: "Close", action: onClose }
      ]}>
        <p className="coach-note">
          {inboxCount === 1
            ? "1 task is in your inbox. Sort it now?"
            : inboxCount + " tasks are in your inbox. Sort them now?"}
        </p>
      </CoachStep>
    );
  }
  return <CoachStep label={label} onClose={onClose} question="Review done. Your lists are up to date" answers={[back, { label: "Close", main: true, action: onClose }]} />;
}

// The pop-up itself. App only draws <Coach> while it's open, and a new one each time it opens,
// so every sort or review starts from the first question
export default function Coach({ mode, tasks, actions, onClose }) {
  const dialog = useRef(null);
  const [currentMode, setCurrentMode] = useState(mode);   // the review can switch to sorting at the end

  // Once the pop-up is on the page, open it as a modal (the page behind it can't be clicked)
  useEffect(function () {
    if (!dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  // The Esc key closes a <dialog> by itself, and then fires "close": tell App
  return (
    <dialog className="coach" id="coach" ref={dialog} onClose={onClose}>
      {currentMode === "sort" ? (
        <SortInbox tasks={tasks} actions={actions} onClose={onClose} />
      ) : (
        <WeeklyReview tasks={tasks} actions={actions} onClose={onClose} onSortInbox={() => setCurrentMode("sort")} />
      )}
    </dialog>
  );
}
