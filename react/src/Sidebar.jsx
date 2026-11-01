// THE SIDEBAR: the same menu as the plain version. It doesn't keep any memory of its own:
// App gives it everything as props (the counts, the chosen filter...) and functions to call
import { useRef } from "react";
import Dog from "./Dog.jsx";
import Icon from "./Icon.jsx";
import { tagColor } from "./tasks.js";

// One menu button. Writing it once as a component saves repeating the same lines 20 times
function FilterButton({ value, title, filter, onChoose, style, children }) {
  return (
    <button className={filter === value ? "filter-button active" : "filter-button"} data-filter={value} title={title} style={style} onClick={() => onChoose(value)}>
      {children}
    </button>
  );
}

// The projects (#) or contexts (@) menu, e.g. [#] garden 2
function TagMenu({ label, tags, symbol, filter, onChoose }) {
  if (tags.length === 0) {
    return null;   // nothing to show: draw nothing
  }
  return (
    <nav className="menu chips" aria-label={label}>
      {tags.map(({ tag, count }) => (
        <FilterButton key={tag} value={tag} title={tag} filter={filter} onChoose={onChoose} style={{ "--tag-color": tagColor(tag) }}>
          <Icon name={symbol === "#" ? "hash" : "at"} />
          <span className="label">{tag.slice(1)}</span>
          <span className="short">{tag.slice(1, 3)}</span>{" "}
          <span className="count">{count}</span>
        </FilterButton>
      ))}
    </nav>
  );
}

export default function Sidebar(props) {
  const { menuOpen, onToggleMenu, search, onSearch, filter, onChoose, counts, projects, contexts } = props;
  const { onSortInbox, onReview, onDownload, onRestoreFile } = props;

  // useRef: a way to reach a real element on the page, here the hidden file picker
  const fileInput = useRef(null);

  // The four lists and Today, written as data, then drawn with map() below
  const lists = [
    { value: "all", icon: "layers", label: "All tasks" },
    { value: "focus", icon: "star", label: "Today" },
    { value: "inbox", icon: "inbox", label: "Inbox" },
    { value: "next", icon: "next", label: "Next" },
    { value: "waiting", icon: "hourglass", label: "Waiting for" },
    { value: "someday", icon: "moon", label: "Someday" }
  ];
  const priorities = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  // The progress bar and "2 of 5 done"
  const progress = counts.all === 0 ? 0 : counts.done / counts.all;
  const progressText = counts.all === 0 ? "No tasks yet" : counts.done + " of " + counts.all + " done";

  // A file was chosen: hand it to App, then empty the picker so the same file works again
  function fileChosen(event) {
    const file = event.target.files[0];
    if (file) {
      onRestoreFile(file);
    }
    event.target.value = "";
  }

  return (
    <aside className="sidebar" id="sidebar">
      {/* BRAND: the dog is the menu switch. Bone in its mouth = open, bone dropped = icons only */}
      <button className="brand" id="menu-toggle" aria-controls="sidebar" aria-expanded={menuOpen} title={menuOpen ? "Hide the menu" : "Show the menu"} onClick={onToggleMenu}>
        <span className="brand-dog"><Dog withBone /></span>
        <span className="brand-name">My To-Do List</span>
      </button>

      {/* SEARCH: what's typed goes into App's memory, and the tasks are redrawn */}
      <div className="search">
        <Icon name="search" className="search-icon" />
        <input
          type="search"
          id="search-input"
          placeholder="Search"
          aria-label="Search tasks"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          onFocus={() => !menuOpen && onToggleMenu()}
        />
      </div>

      <p className="menu-title">Lists</p>
      <nav className="menu">
        {lists.map((list) => (
          <FilterButton key={list.value} value={list.value} title={list.label} filter={filter} onChoose={onChoose}>
            <Icon name={list.icon} />
            <span className="label">{list.label}</span> <span className="count">{counts[list.value]}</span>
          </FilterButton>
        ))}
      </nav>

      <p className="menu-title">Filter</p>
      <nav className="menu segmented" aria-label="Show">
        <FilterButton value="active" title="Active (not done yet)" filter={filter} onChoose={onChoose}>
          <Icon name="circle" />
          <span className="label">Active</span> <span className="count">{counts.active}</span>
        </FilterButton>
        <FilterButton value="done" title="Done" filter={filter} onChoose={onChoose}>
          <Icon name="circle-check" />
          <span className="label">Done</span> <span className="count">{counts.done}</span>
        </FilterButton>
      </nav>
      <nav className="menu segmented" aria-label="Priority">
        {priorities.map((priority) => (
          <FilterButton key={priority.value} value={priority.value} title={priority.label + " priority"} filter={filter} onChoose={onChoose}>
            <span className={"priority-key key-" + priority.value}></span>
            <span className="label">{priority.label}</span> <span className="count">{counts[priority.value]}</span>
          </FilterButton>
        ))}
      </nav>

      {/* TAGS: only shown when a task uses one */}
      {(projects.length > 0 || contexts.length > 0) && <p className="menu-title">Tags</p>}
      <div className="tag-chips">
        <TagMenu label="Projects" tags={projects} symbol="#" filter={filter} onChoose={onChoose} />
        <TagMenu label="Contexts" tags={contexts} symbol="@" filter={filter} onChoose={onChoose} />
      </div>

      <div className="sidebar-footer">
        <div className="progress-row">
          <div className="progress" aria-hidden="true">
            <div className="progress-fill" style={{ transform: "scaleX(" + progress + ")" }}></div>
          </div>
          <p id="task-counter">{progressText}</p>
        </div>

        <p className="menu-title">Dog coach</p>
        <div className="tool-buttons">
          <button className="tool-button" title="Sort my inbox with the dog" onClick={onSortInbox}>
            <Icon name="list-checks" /><span className="label">Sort inbox</span>
          </button>
          <button className="tool-button" title="Weekly review with the dog" onClick={onReview}>
            <Icon name="calendar-check" /><span className="label">Weekly review</span>
          </button>
        </div>

        <p className="menu-title">Backup</p>
        <div className="tool-buttons">
          <button className="tool-button" title="Download my tasks as a backup file" onClick={onDownload}>
            <Icon name="download" /><span className="label">Download</span>
          </button>
          <button className="tool-button" title="Restore tasks from a backup file" onClick={() => fileInput.current.click()}>
            <Icon name="upload" /><span className="label">Restore</span>
          </button>
        </div>
        <input type="file" ref={fileInput} accept=".json,application/json" hidden onChange={fileChosen} />
      </div>
    </aside>
  );
}
