# 🐶 Things to do

**Version 0.6** · My first ever coding project: a to-do list app, built from zero knowledge with the help of [Claude Code](https://claude.com/claude-code). First in plain HTML, CSS and JavaScript, and now rebuilt in **React**.

### 👉 [**Try it live here**](https://dudepsycho.github.io/my-first-todo-app/). It works on your phone too!

🗺️ **Where it's going:** [the roadmap](https://dudepsycho.github.io/my-first-todo-app/roadmap/), a trail of stops from today to version 10.

Before this project I had never written a line of code. I didn't know what HTML was, what a function was, or how GitHub worked. This README is the log of how I got from nothing to a working app that helps you get things done, with a dog that helps you along.

![Screenshot of the to-do app](screenshot.png)

---

## ✨ What it does

**Capture and organize**
- ➕ **Add, edit and delete tasks.** New tasks land in your **Inbox**, so you can write things down fast and sort them later.
- 🗂️ **Lists for every kind of task:** **Next** (things you can do now), **Waiting for** (someone else has to act first) and **Someday** (ideas, no pressure)
- ⭐ **Today:** star the few tasks you want to focus on today
- 🏷️ **Tags:** type `#garden` for a project or `@home` for a context, and they become chips you can filter by. Every tag gets its own color, and keeps it
- 📅 **Due dates** (overdue tasks turn pink) and **priorities** (High / Medium / Low, shown as the color of each card's edge)
- 🔍 **Search** that filters while you type
- ⚡ **Smart Quick Add:** type `Call mum friday !high weekly` and the date, priority and repeat fill in by themselves. Start a day word like `fri` and press **Tab** (or tap the suggestion on a phone) to finish it
- 🗓️ **Overdue, Due today and Upcoming views** in the menu, earliest date first
- 🔁 **Repeating tasks:** daily, weekly or monthly. Tick one and a fresh copy appears with the next date
- ↩️ **Undo after delete:** a bar slides up for 10 seconds, and the task comes back exactly where it was

**The dog** 🐶
- **Pet it for a real tip** about your tasks: what's overdue, what's due today, how many are waiting in your inbox
- It tells you what just happened: "Added to Inbox. 3 tasks to sort", "Done. 4 tasks left"
- A second dog, a **Lhasa Apso**, sits under the Add button. Tap it to learn one trick at a time, and while you type it tells you what it understood ("Due Fri 6 Nov · High priority")
- The strip at the top shows playful dog commands that double as tips ("fetch the next task", "sit. stay. focus."), in a new order every visit

**The dog coach**
- **Sort my inbox:** the dog asks about each new task, one question at a time. Can you act on it? What's the very next step? Can you do it in under 2 minutes? Who does it?
- **Weekly review:** the dog walks you through your lists in 8 short steps, from what you finished to clearing your head

**Everything else**
- ✅ Finished tasks move to their own **Done** section, and paw prints walk away from them
- 📊 A **progress bar** that fills up as you finish tasks
- 💾 **Remembers everything** in your browser, plus **Download** and **Restore** for a backup file, so your tasks are safe even if the browser data gets cleared
- 🌙 **Dark mode**, which is remembered too
- 🦴 **A menu you can shrink:** tap the little dog. Bone in its mouth = full menu, bone dropped = icons only. Your tasks stay exactly where they are
- 📱 **Made for phones too:** on a phone the menu becomes a slim strip of icons and slides open over the page

It's based on the **Getting Things Done** idea (GTD): get everything out of your head, decide the next step for each thing, put it in the right list, and look over your lists once a week. The dog is there to help: it tells you what's next, and never nags.

## 🚀 How to use it

**Easiest:** open the [live version](https://dudepsycho.github.io/my-first-todo-app/) in any browser.

**Or run it on your own computer.** You need [Node.js](https://nodejs.org/) for the React version.

1. Click the green **Code** button on this page, then **Download ZIP**, and unzip it.
2. Open the **`react`** folder in a terminal.
3. Run `npm install` once, then `npm run dev`, and open the link it shows.

The first, plain version needs nothing at all: open the **`html`** folder and double-click **`index.html`**.

Your tasks are saved in your own browser only. Nothing is sent anywhere, and there's no account.

## 📁 What's inside

The same app, built two ways:

| Folder | What it is |
|---|---|
| `react/` | **The React version (the current one).** All new work happens here |
| `app/` | The React version packed into plain files by `npm run build`. This is what the live site shows |
| `html/` | **The first, plain version** (up to v0.2): HTML, CSS and JavaScript, no frameworks. It's finished, and kept as it was |
| `roadmap/` | The roadmap page: where the app is going |
| `index.html` | A tiny page that sends the live link on to `app/` |

**The React version (`react/`)** splits the app into small pieces called components:

| File (in `react/src/`) | What it does |
|---|---|
| `App.jsx` | The app's memory (filter, search, dark mode, the dog) and the main page |
| `useTasks.js` | The list of tasks, and the only functions allowed to change it. It saves by itself |
| `TaskItem.jsx` | One task card |
| `Sidebar.jsx` | The menu |
| `Coach.jsx` | The dog coach |
| `Dog.jsx`, `Lhasa.jsx`, `Icon.jsx` | The two dog drawings and the line icons |
| `tasks.js` | Small helpers: finding tags, picking tag colors, checking tasks, reading Quick Add words, working out the next date of a repeating task |
| `style.css` | How it looks |

**The plain version (`html/`)** is three files:

| File | What it does | Think of it as… |
|---|---|---|
| `index.html` | **What** is on the page: the sidebar, the text box, the lists, the dog | The walls and rooms of a house |
| `style.css` | **How it looks**: colors, fonts, shadows, animations | The paint and decoration |
| `script.js` | **What it does**: adding, saving, filtering, the dog coach | The electricity and plumbing |

The code has lots of comments, because I needed them to understand it.

---

## 🛣️ The journey log

I worked with Claude Code (an AI coding assistant that runs in your terminal or code editor). I asked it to be very guided and explain everything simply. For most steps it showed me the code and explained it, and **I typed it in myself**. For the big changes, it built them and then walked me through what changed.

### Step 0: The starting point
Zero knowledge. Claude asked me a few questions first: what my goal was (learn *and* get a working app), where the app should run (a web browser, because that's easiest for beginners), and which features I wanted to start with (just add and delete).

### Step 1: The first version: add & delete
Claude built a tiny app and explained the **three files every web page is made of** (HTML, CSS and JavaScript). My first change ever was turning the background pink by editing one line of CSS. 🎀

> **Learned:** tags (`<h1>`, `<button>`), ids, CSS colors, and the cycle of *change → save → refresh → see the result*.

### Step 2: Mark tasks as done
I added a checkbox to each task. Ticking it crosses the task out.

> **Learned:** `addEventListener` ("when this is clicked, do that") and `classList.toggle` (switching a style on and off, like a light switch).

### Step 3: Remember tasks 💾
Tasks used to vanish when I refreshed the page. Now they're saved in the browser.

> **Learned:** `localStorage` (the browser's little notebook), `JSON` (turning lists into text and back), splitting one function into two, arrays `[]` and objects `{}`. Also: press **F12 → Console** to see what the browser thinks.

### Step 4: Edit a task ✏️
I added an Edit button to change a task's text.

> **Learned:** `prompt()`, plus `!==` ("is not equal to") and `&&` ("and").

### Step 5: Filters: All / Active / Done 🔍
> **Learned:** `let` vs `const`, `if / else if / else`, `!` ("not"), and `data-` attributes for attaching little notes to HTML.

### Step 6: Due dates & priorities 📅
Each task got a date picker and a High / Medium / Low priority. Overdue dates turn pink.

> **Learned:** joining text with `+`, default values with `||`, and comparing dates.

### Step 7: Editing dates too
Edit became an in-place edit, with a text box and a date picker right inside the task.

> **Learned:** **don't repeat yourself**. The date code was needed in two places, so it moved into its own reusable function.

### Step 8: Dark mode 🌙 and a task counter
> **Learned:** one setting at the top of the page can change the whole look. Also `.length` for counting.

### Step 9: Making it look good 🎨
I tried a few looks (minimal, editorial, neo-brutalism) until one felt right: **neo-brutalism with soft pastels and a dog theme**. That means ink outlines, hard sticker-like shadows, buttons that press in, and handwriting for everything the dog says.

> **Learned:** CSS **variables** (name every color once at the top, so dark mode only has to swap a few names), Google Fonts, `transition` and `@keyframes` animations, `:hover` / `:active`, and `@media` for phone screens.

### Step 10: Sidebar menu + a separate Done section 🗂️
Finished tasks move to their own section. The filters moved into a sidebar with live counts and a progress bar.

> **Learned:** `appendChild` *moves* an element if it's already on the page, the difference between `class` (reusable) and `id` (unique), CSS grid layouts, and `:empty`.

### Step 11: The dog 🐶
I added a mascot drawn from simple SVG shapes (circles, ellipses and lines). Click it and it hops and talks. When you finish a task, a copy of it runs across the screen.

> **Learned:** SVG drawing, `transform-origin` (what something rotates around), `cloneNode`, `setTimeout` and `Math.random()`.

### Step 12: Putting it on GitHub 🐙
I learned what Git and GitHub are, and published this project so anyone can see it. Before uploading, I ran a security check for passwords, keys and personal details, and set up GitHub's private "no-reply" email for my commits. Then I turned on **GitHub Pages** for a free live link, and added an **MIT license** so others can learn from and reuse the code.

> **Learned:** repositories, commits, pushing, `.gitignore`, keeping my email private, GitHub Pages, and open-source licenses.

### Step 13: Backup & restore 💾
Everything lived only in the browser, so I added **Download** (save all tasks to a file) and **Restore** (bring them back). Restoring *merges* the file with what you already have and skips duplicates, and it checks every task in the file first, so a broken file can't break the app.

> **Learned:** a `Blob` (a file made inside the browser), `FileReader` (reading a file from your computer), and why you should never trust data from outside without checking it.

### Step 14: Search 🔍
A search box that filters while you type, and works together with every other filter.

> **Learned:** the `"input"` event, `.toLowerCase()` and `.includes()`.

### Step 15: Getting Things Done 🧠
The biggest upgrade: the **Inbox, Next, Waiting for and Someday** lists, **⭐ Today**, **#project and @context tags**, and the **dog coach** that helps you sort your inbox and review your week.

> **Learned:** regular expressions (patterns that find `#words` in text), the `<dialog>` element for pop-ups, and turning a conversation into a chain of small functions, one per question.

### Step 16: Making it feel like a real app 🪄
A big polish pass:
- the sidebar became a full-height panel that fits on one screen
- emoji buttons became clean line icons that look the same on every device
- colors only where they mean something (priority, tags, the dog)
- calmer motion, clear focus rings for keyboard users
- a tidy-up of code that was no longer needed

> **Learned:** design tokens, `transform` for smooth animations, accessibility basics, and that deleting code can be the best improvement.

### Step 17: A menu that fits in your pocket 🦴
The little dog at the top of the menu became its switch: with the bone in its mouth the menu is open, and when it drops the bone the menu shrinks to a strip of icons (even for filters and tags). On phones the strip is always there, and the full menu slides in over the page. I also tested it the way phones really behave: iPhones zoom into small text boxes, and the browser toolbar can hide the bottom of the screen.

> **Learned:** `@media` queries for different screen sizes, `100dvh` (the part of the screen you can actually see), and that a phone is not just a small computer.

### Step 18: Rebuilding it in React ⚛️
I wanted to learn a framework, so the whole app was rebuilt in **React**, feature for feature, and it looks exactly the same. The big idea: in my plain version *the page was the data*, and after every change I had to remember to save, filter and recount. In React, the list of tasks is the truth and the page is drawn from it, so all of that happens by itself. The plain version is now finished and kept in `html/`.

> **Learned:** components, props, state (`useState`), effects (`useEffect`), my own hook (`useTasks`), why every list item needs a `key`, Node.js and npm, and Vite (the tool that runs and packs a React app).

### Step 19: A dog that actually helps 🐾
I noticed the dog only said things like "good human", which nobody needs to hear. Now every line is useful: petting it gives a real tip about my tasks, and it says what just happened with a number ("Done. 4 tasks left"). The strip at the top got playful dog commands that are also tips. Tags got their own colors, the content stays perfectly still when the menu shrinks, and I checked everything again on phone sizes.

> **Learned:** turning text into a number to pick a color that never changes, shuffling a list, `matchMedia` (noticing when the screen becomes phone-sized), and that good feedback tells you something.

### Step 20: Typing is faster than clicking ⚡
I wanted to add a task without touching the date box or the priority menu. Now the text box reads what I type: `tomorrow`, `friday`, `!high`, `weekly`. It takes those words out of the task and fills in the rest. While I type, grey letters finish the word, and a second dog, a Lhasa Apso, tells me what it understood.

> **Learned:** regular expressions again (this time to match whole words only), keeping one small function that does one job (`parseQuickAdd`), and drawing a second dog with SVG shapes.

### Step 21: Undo, date views and repeating tasks 🔁
A task can disappear with one tap, so a bar now offers **Undo** for 10 seconds. The menu got **Overdue, Due today and Upcoming** views, and tasks can **repeat**: tick one and the next one appears with the next date.

> **Learned:** a list index (to put a task back in its old place), the `popover` element (so the bar shows above a pop-up), working with dates as text that sorts correctly, and testing the odd cases, like a monthly task on the 31st.

### Step 22: A roadmap 🗺️
I wrote down where the app is going as a page of its own: a trail with a stop for every version, in the same style as the app.

> **Learned:** that a plan is easier to follow when you can see it.

---

## 🏷️ Version history

**v0.6** (1 November 2026): **Smart Quick Add** (type a day, a priority or a repeat right in the task), a **Lhasa Apso helper** that teaches the tricks, **Undo after delete**, **Overdue / Due today / Upcoming** views, **repeating tasks**, and a **roadmap page**.

**v0.5** (1 November 2026): the app is now built with **React** (the live site shows the React version). The dog gives real tips instead of praise, the top strip has dog commands in a new order every visit, every tag has its own color, the content stays still when the menu shrinks, and phones get a matching dark browser bar with no white flash.

**v0.2** (1 November 2026): the dog-and-bone menu that shrinks to icons, a phone layout with a slide-in menu, and fixes so it works on older iPhones too.

**v0.1** (1 November 2026): the first named version. Everything above: tasks with dates and priorities, GTD lists, Today, tags, search, the dog coach, backup and restore, dark mode, and a layout that works on desktop and phone.

## 🧠 The biggest things I learned

1. **Code is very literal.** One missing `}` or `,` can break everything, and that's normal.
2. **Read the error.** **F12 → Console** tells you what's wrong, and usually where.
3. **Small steps.** Change one thing, save, refresh, test. Repeat.
4. **Typing the code yourself** (instead of only copy-pasting) is how it actually sticks.
5. **Simple beats clever.** The best change is often the smallest one that works.

## 💡 Tips if you're a beginner too

- Ask the AI to **explain every line** and to **let you type** the code.
- When something breaks, say *"check my code"* and ask **why** it broke, not just for the fix.
- In VS Code, click next to a `{` and its matching `}` lights up.
- You don't need to understand everything at once. I still don't!

## 🛠️ Built with

- [React](https://react.dev/) and [Vite](https://vite.dev/) (the current version)
- HTML, CSS and JavaScript (the first version, no frameworks)
- [Claude Code](https://claude.com/claude-code) as my coding teacher and pair programmer
- Fonts from [Google Fonts](https://fonts.google.com/): Bricolage Grotesque, Geist and Patrick Hand
- Icon shapes from [Lucide](https://lucide.dev/) (ISC license)

## 📄 License

[MIT](LICENSE). You're free to use, copy, change and share this code, even in your own projects. Just keep the license note.

---

*Started 31 October 2026 · Version 0.6 on 1 November 2026 · Made with patience, a lot of questions, and one very good dog.* 🐾
