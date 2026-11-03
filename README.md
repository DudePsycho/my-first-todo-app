# Things to do

A task manager built in one weekend with [Claude Code](https://claude.com/claude-code). One set of tasks, three ways to see it: a list, a kanban board and a calendar. With notes, steps, reminders, history and a dog.

**Version 1.0.1** · Built 31 October to 2 November 2026

### [Open the live app](https://dudepsycho.github.io/my-first-todo-app/)

Works on desktop and phone. No account, no server: your tasks stay in your browser.

![Screenshot of the app in Board view](screenshot.png)

---

## What a weekend with Claude Code gets you

| | |
|---|---|
| **Time** | One long weekend: Saturday 31 October to Monday 2 November 2026 |
| **Code** | About 5,100 lines of JavaScript (React 19) and 4,700 lines of CSS |
| **Views** | List, Kanban board, and a calendar with month, week, day and agenda |
| **Download** | About 260 KB gzipped, rich-text editor included |
| **Checks** | 302 automated browser checks, 8 real-mouse drag tests in Firefox, 9 unit checks |
| **Libraries** | React, plus two focused ones: TipTap (notes) and dnd-kit (drag and drop) |
| **Backend** | None. Everything is saved in the browser, with backup and restore |

## What it does

**Three views over the same tasks**
- **List:** Inbox, Next, Waiting for, Someday and Done, built on the Getting Things Done method
- **Board:** cards in columns, grouped by list, priority or due date. Drag between columns and up and down, add a task inside a column, select several cards and move them together, sort and filter each column, set a limit per column, and split the board into rows per project
- **Calendar:** month, week, day and agenda. Drag a task onto a day or onto a time, keep undated tasks in a side panel, see repeating tasks on the days they return, and move around with the arrow keys

**Capture fast**
- **Smart Quick Add:** type `Call mum friday at 3pm !high weekly` and the date, time, priority and repeat fill themselves in. Word completion with Tab
- Tags written in the text: `#garden` for a project, `@home` for a context
- Repeating tasks (daily, weekly, monthly), search, due-date views, and undo after delete

**Everything a task needs**
- **Notes with real formatting:** headings, sizes, colours, highlights, bullet, numbered and check lists, tables, links
- **Steps:** a checklist inside a task, with a progress bar on the card
- **Reminders:** a time on a task, a bar with Done and Snooze when it is due, and a browser notification if you allow it
- **Templates:** add a whole set of tasks in one click (a morning routine, packing for a trip), or make your own

**Progress without pressure**
- **History:** what you finished, day by day, with a 7-day chart
- **Streaks and levels:** days in a row, your best run, and a dog that grows from Puppy to Best in show. One switch turns it all off
- A coach that walks you through sorting your inbox and a weekly review

**Details**
- Dark mode, a menu that shrinks to icons, and a phone layout checked at 360 and 390 px
- Keyboard and screen reader support, including dragging with Space and the arrow keys, and reduced-motion support
- Back up all tasks to a file and restore them later. Restore merges, skips duplicates and checks every task first

## How it was built

I set the direction and made the product decisions. Claude Code wrote the code.

- **Questions before code.** Every feature started with questions about how it should behave. I answered them before anything was built.
- **Small and reviewed.** Each change was checked for size before I saw it: the smallest version that works and stays readable.
- **Researched, not guessed.** The board and calendar were designed after looking at how good ones work. Libraries were compared on keyboard access, size and cost. That is why drag and drop uses dnd-kit and the calendar is hand-built instead of pulling in a heavy calendar library.
- **Tested like a person.** The suite drives a real browser with seeded data, and drags run with a real mouse in both Chrome and Firefox. The test scripts are not part of this repository.
- **Checked before every publish** for keys, tokens, personal details and local paths.

## Design decisions worth a look

- **One source of truth.** The task list lives in a single hook, `useTasks`, and only its functions may change it. Every view is drawn from that list.
- **Careful storage.** Saved data is read defensively. If it is damaged, it is copied aside before anything can overwrite it. Every task has a permanent id.
- **Dates done properly.** Dates are plain local `YYYY-MM-DD` text, so they sort and compare correctly. A monthly task keeps its day: 31 Jan, 28 Feb, 31 Mar.
- **Drag that feels physical.** The card lifts, a slot opens under the pointer, and the card settles in with a small bounce. Touch drags start after a short hold, so scrolling still works.
- **Pinned dependencies.** Exact versions, all MIT licensed.
- **One design system.** Every colour, font and shadow is a CSS variable, so dark mode swaps a handful of values.

## Run it yourself

You need [Node.js](https://nodejs.org/).

```
cd react
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). `npm run build` packs the app into `app/`, which is what the live site serves.

## What's inside

| Folder | What it is |
|---|---|
| `react/` | The source: React 19 and Vite |
| `app/` | The built app, served by GitHub Pages |
| `index.html` | A small page that sends the live link on to `app/` |

| File in `react/src/` | What it does |
|---|---|
| `App.jsx` | The app's memory (filter, search, view, dark mode, reminders) and the main page |
| `useTasks.js` | The task list, and the only functions allowed to change it. It saves by itself |
| `Board.jsx`, `Calendar.jsx` | The two extra views, with their drag and drop |
| `TaskItem.jsx`, `TaskDetails.jsx`, `TaskComposer.jsx` | A task in the list, the task pop-up, and the "add a task" box |
| `NotesEditor.jsx` | The notes box with its formatting toolbar |
| `History.jsx`, `Templates.jsx`, `Coach.jsx` | History and streaks, templates, and the inbox and weekly-review coach |
| `Sidebar.jsx`, `Dog.jsx`, `Lhasa.jsx`, `Icon.jsx` | The menu, the two dogs, and the line icons |
| `tasks.js` | Plain helpers: dates, tags, Quick Add parsing, repeats, streaks and levels |
| `dragFeel.js`, `usePhone.js` | How dragging feels, and detecting a phone-sized screen |
| `style.css` | All the styling |

## Status

Version 1.0.1. Complete as a weekend project, and paused for now. Everything described above works today.

## Built with

- [React](https://react.dev/) and [Vite](https://vite.dev/)
- [TipTap](https://tiptap.dev/) for the notes editor and [dnd-kit](https://dndkit.com/) for drag and drop (both MIT licensed)
- [Claude Code](https://claude.com/claude-code) as the pair programmer
- Fonts from [Google Fonts](https://fonts.google.com/): Bricolage Grotesque, Geist and Patrick Hand
- Icon shapes from [Lucide](https://lucide.dev/) (ISC license)

## License

[MIT](LICENSE). Use it, change it, share it. Keep the license note.
