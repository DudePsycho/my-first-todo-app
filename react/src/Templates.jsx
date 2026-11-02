// TEMPLATES: one button adds a whole set of tasks (a morning routine, a trip...).
// It's a pop-up in the dog coach's style. From the list you can:
//   pick a template → choose how to add it (separate tasks, or one task with steps)
//   make a new one, edit one (the same form), or delete one (with Undo)
//   save a #project as a template
// Your templates are kept in this browser (under "my-templates"). Until you change
// something, the list is the three ready-made ones
import { useEffect, useRef, useState } from "react";
import { CoachStep } from "./Coach.jsx";
import Icon from "./Icon.jsx";
import { REPEAT_NAMES, findTags, newId, recall, remember, todayString } from "./tasks.js";

// The ready-made templates. repeat: every task it adds repeats ("" = no repeat)
const BUILT_IN = [
  {
    id: "morning",
    name: "Morning routine",
    tag: "#morning",
    repeat: "daily",
    items: ["Make the bed", "Drink a glass of water", "Stretch for 5 minutes", "Plan the day"]
  },
  {
    id: "trip",
    name: "Trip packing",
    tag: "#trip",
    repeat: "",
    items: ["Passport or ID", "Tickets and bookings", "Phone charger", "Clothes", "Toiletries", "Medicine", "Keys and wallet"]
  },
  {
    id: "reset",
    name: "Weekly reset",
    tag: "#reset",
    repeat: "",
    items: ["Do the laundry", "Buy groceries", "Tidy the desk", "Plan next week", "Download a backup of my tasks"]
  }
];

// Does a saved template have everything it needs?
function isTemplate(template) {
  return (
    template !== null &&
    typeof template === "object" &&
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.tag === "string" &&
    Array.isArray(template.items) &&
    template.items.length > 0
  );
}

// Your templates, read SAFELY: anything broken is left out. Nothing saved yet: the ready-made ones
function loadTemplates() {
  try {
    const saved = JSON.parse(recall("my-templates"));
    if (Array.isArray(saved)) {
      return saved.filter(isTemplate);
    }
  } catch (error) {
    // damaged: start again from the ready-made ones
  }
  return BUILT_IN;
}

// A tag made from a name: "Gym day!" becomes "#gym-day" ("" if there's nothing to use)
function tagFromName(name) {
  const word = name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return word === "" ? "" : "#" + word;
}

// A typed tag, tidied: "  #My Trip " becomes "#my-trip" ("" = no tag)
function cleanTag(text) {
  const word = text.replace(/#/g, "").trim().toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "");
  return word === "" ? "" : "#" + word;
}

// tasks: every task (to find the #projects). onAdd(text, dueDate, repeat, steps) adds one task.
// onAdded(count) lets App's dog say what was added
export default function Templates({ tasks, onAdd, onAdded, onClose }) {
  const dialog = useRef(null);
  const [templates, setTemplates] = useState(loadTemplates);
  const [chosen, setChosen] = useState(null);     // the template picked to add (null = none)
  const [form, setForm] = useState(null);         // the New/Edit form's boxes (null = closed)
  const [deleted, setDeleted] = useState(null);   // the last deleted template and its place, for Undo
  const undoTimer = useRef();

  // Once the pop-up is on the page, open it as a modal (the same as the dog coach)
  useEffect(function () {
    if (!dialog.current.open) {
      dialog.current.showModal();
    }
    return () => clearTimeout(undoTimer.current);
  }, []);

  // Every #project used in any task (finished ones too: a finished trip makes a good template)
  const projects = [];
  tasks.forEach((task) => {
    findTags(task.text, "#").forEach((tag) => {
      if (!projects.includes(tag)) {
        projects.push(tag);
      }
    });
  });
  projects.sort();

  // The ready-made templates you've deleted (they can be brought back)
  const missing = BUILT_IN.filter((builtIn) => !templates.some((template) => template.id === builtIn.id));

  function saveTemplates(list) {
    setTemplates(list);
    remember("my-templates", JSON.stringify(list));
  }

  // Put a template in the list: in its old place if it's already there (same id), otherwise at the end
  function putTemplate(template) {
    if (templates.some((old) => old.id === template.id)) {
      saveTemplates(templates.map((old) => (old.id === template.id ? template : old)));
    } else {
      saveTemplates([...templates, template]);
    }
  }

  // ---------- SAVE A #PROJECT ----------
  // The names of its tasks, without the #garden (it's added back when the template is used).
  // Saving the same project again replaces the template with that tag
  function saveProject(tag) {
    const items = [];
    tasks.forEach((task) => {
      if (findTags(task.text, "#").includes(tag)) {
        const text = task.text.replace(tag, "").replace(/\s+/g, " ").trim();
        if (text !== "" && !items.includes(text)) {
          items.push(text);
        }
      }
    });
    if (items.length === 0) {
      return;   // only the tag, no task names: nothing to save
    }
    const sameTag = templates.find((template) => template.tag === tag);
    const name = tag[1].toUpperCase() + tag.slice(2);   // "#garden" becomes "Garden"
    putTemplate({ id: sameTag ? sameTag.id : newId(), name, tag, repeat: "", items });
  }

  // ---------- DELETE, WITH UNDO ----------
  // The template goes straight away; for 6 seconds an Undo button can put it back in its place
  function deleteTemplate(template) {
    const index = templates.indexOf(template);
    saveTemplates(templates.filter((other) => other !== template));
    setDeleted({ template, index });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setDeleted(null), 6000);
  }

  function undoDelete() {
    saveTemplates([...templates.slice(0, deleted.index), deleted.template, ...templates.slice(deleted.index)]);
    clearTimeout(undoTimer.current);
    setDeleted(null);
  }

  function bringBack() {
    saveTemplates([...templates, ...missing]);
  }

  // ---------- THE NEW / EDIT FORM ----------
  // template = null for a new one. tagTouched: once you change the tag yourself,
  // typing the name stops filling it in
  function openForm(template) {
    if (template) {
      setForm({ id: template.id, name: template.name, tag: template.tag, tagTouched: true, items: template.items.join("\n"), repeat: template.repeat, problem: "" });
    } else {
      setForm({ id: "", name: "", tag: "", tagTouched: false, items: "", repeat: "", problem: "" });
    }
  }

  function nameChanged(name) {
    setForm({ ...form, name, tag: form.tagTouched ? form.tag : tagFromName(name) });
  }

  function saveForm() {
    const name = form.name.trim();
    const items = form.items.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    if (name === "") {
      setForm({ ...form, problem: "Give it a name" });
      return;
    }
    if (items.length === 0) {
      setForm({ ...form, problem: "Write at least one task" });
      return;
    }
    putTemplate({ id: form.id || newId(), name, tag: cleanTag(form.tag), repeat: form.repeat, items });
    setForm(null);
  }

  // ---------- ADDING A TEMPLATE'S TASKS ----------
  // A repeating template needs a first date to repeat from: today
  function firstDate() {
    return chosen.repeat ? todayString() : "";
  }

  // " #trip" after each task's text ("" when the template has no tag)
  function tagEnding() {
    return chosen.tag ? " " + chosen.tag : "";
  }

  function addSeparately() {
    chosen.items.forEach((item) => onAdd(item + tagEnding(), firstDate(), chosen.repeat, []));
    onAdded(chosen.items.length);
    onClose();
  }

  function addAsSteps() {
    const steps = chosen.items.map((item) => ({ text: item, done: false }));
    onAdd(chosen.name + tagEnding(), firstDate(), chosen.repeat, steps);
    onAdded(1);
    onClose();
  }

  // ---------- THE PAGE ----------
  // One template in the list: its name and how many tasks, then edit and delete buttons
  function templateRow(template) {
    return (
      <li key={template.id}>
        <button className="template-pick" onClick={() => setChosen(template)}>
          <strong>{template.name}</strong>
          <span>{template.items.length} tasks{template.repeat ? " · repeats " + template.repeat : ""}</span>
        </button>
        <button className="icon-button" aria-label={"Edit the " + template.name + " template"} title="Edit this template" onClick={() => openForm(template)}>
          <Icon name="pencil" />
        </button>
        <button className="icon-button" aria-label={"Delete the " + template.name + " template"} title="Delete this template" onClick={() => deleteTemplate(template)}>
          <Icon name="trash" />
        </button>
      </li>
    );
  }

  let page;
  if (form) {
    page = (
      <CoachStep
        label={form.id ? "Templates · Edit" : "Templates · New"}
        question={form.id ? "Change this template" : "Make a new template"}
        answers={[
          { label: "← Back", action: () => setForm(null) },
          { label: "Save template", main: true, action: saveForm }
        ]}
        onClose={onClose}
      >
        <label className="form-label" htmlFor="template-name">Name</label>
        <input id="template-name" className="coach-input" placeholder="e.g. Gym day" value={form.name} onChange={(event) => nameChanged(event.target.value)} />
        <label className="form-label" htmlFor="template-tag">Tag <span>(optional, added to every task)</span></label>
        <input id="template-tag" className="coach-input" placeholder="#gym" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value, tagTouched: true })} />
        <label className="form-label" htmlFor="template-items">Tasks <span>(one per line)</span></label>
        <textarea id="template-items" className="coach-input template-items" rows="6" placeholder={"Pack the gym bag\nFill the water bottle"} value={form.items} onChange={(event) => setForm({ ...form, items: event.target.value })} />
        <label className="form-label" htmlFor="template-repeat">Repeat</label>
        <select id="template-repeat" className="coach-input" value={form.repeat} onChange={(event) => setForm({ ...form, repeat: event.target.value })}>
          <option value="">Doesn’t repeat</option>
          {Object.keys(REPEAT_NAMES).map((repeat) => (
            <option key={repeat} value={repeat}>Repeats {repeat}</option>
          ))}
        </select>
        {form.problem && <p className="coach-note form-problem" role="alert">{form.problem}</p>}
      </CoachStep>
    );
  } else if (chosen) {
    page = (
      <CoachStep
        label={"Templates · " + chosen.name}
        question="How should it be added?"
        answers={[
          { label: "← Back", action: () => setChosen(null) },
          { label: "Separate tasks", main: true, action: addSeparately },
          { label: "One task with steps", action: addAsSteps }
        ]}
        onClose={onClose}
      >
        <ul className="coach-list">
          {chosen.items.map((item) => (
            <li key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="coach-note">
          {chosen.tag ? "Tagged " + chosen.tag + ", into" : "Into"} your Inbox{chosen.repeat ? ", repeating " + chosen.repeat + " from today" : ""}.
        </p>
      </CoachStep>
    );
  } else {
    page = (
      <CoachStep label="Templates" question="Pick a set of tasks to add" answers={[{ label: "Close", action: onClose }]} onClose={onClose}>
        {templates.length === 0 && <p className="coach-note">No templates yet. Make one below</p>}
        <ul className="template-list">{templates.map(templateRow)}</ul>

        {/* For 6 seconds after a delete */}
        {deleted && (
          <p className="template-undo" role="status">
            Deleted ‘{deleted.template.name}’
            <button className="undo-button" onClick={undoDelete}>Undo</button>
          </p>
        )}

        <button className="coach-answer template-new" onClick={() => openForm(null)}>
          + New template
        </button>

        {projects.length > 0 && (
          <>
            <p className="coach-note">Or make one from a project:</p>
            <div className="template-save">
              {projects.map((tag) => (
                <button key={tag} className="coach-answer" onClick={() => saveProject(tag)}>
                  Save {tag}
                </button>
              ))}
            </div>
          </>
        )}

        {missing.length > 0 && (
          <button className="link-button" onClick={bringBack}>
            Bring back the ready-made templates
          </button>
        )}
      </CoachStep>
    );
  }

  return (
    <dialog className="coach" id="templates" ref={dialog} onClose={onClose}>
      {page}
    </dialog>
  );
}
