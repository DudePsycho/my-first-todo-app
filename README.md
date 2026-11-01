# 🐶 Things to do

**Version 0.1** · My first ever coding project: a to-do list app, built from zero knowledge with the help of [Claude Code](https://claude.com/claude-code).

### 👉 [**Try it live here**](https://dudepsycho.github.io/my-first-todo-app/). It works on your phone too!

Before this project I had never written a line of code. I didn't know what HTML was, what a function was, or how GitHub worked. This README is the log of how I got from nothing to a working app that helps you get things done, with a dog cheering you on.

![Screenshot of the to-do app](screenshot.png)

---

## ✨ What it does

**Capture and organize**
- ➕ **Add, edit and delete tasks.** New tasks land in your **Inbox**, so you can write things down fast and sort them later.
- 🗂️ **Lists for every kind of task:** **Next** (things you can do now), **Waiting for** (someone else has to act first) and **Someday** (ideas, no pressure)
- ⭐ **Today:** star the few tasks you want to focus on today
- 🏷️ **Tags:** type `#garden` for a project or `@home` for a context, and they become colored chips you can filter by
- 📅 **Due dates** (overdue tasks turn pink) and **priorities** (High / Medium / Low, shown as the color of each card's edge)
- 🔍 **Search** that filters while you type

**The dog coach** 🐶
- **Sort my inbox:** the dog asks about each new task, one question at a time. Can you act on it? What's the very next step? Can you do it in under 2 minutes? Who does it?
- **Weekly review:** the dog walks you through your lists in 8 short steps, from celebrating what you finished to clearing your head

**Everything else**
- ✅ Finished tasks move to their own **Done** section, and paw prints walk away from them
- 📊 A **progress bar** that fills up as you finish tasks
- 💾 **Remembers everything** in your browser, plus **Download** and **Restore** for a backup file, so your tasks are safe even if the browser data gets cleared
- 🌙 **Dark mode**, which is remembered too
- 📱 **Works on phones**

It's based on the **Getting Things Done** idea (GTD): get everything out of your head, decide the next step for each thing, put it in the right list, and look over your lists once a week. The dog is kind about it: it cheers when you finish things and never nags.

## 🚀 How to use it

**Easiest:** open the [live version](https://dudepsycho.github.io/my-first-todo-app/) in any browser.

**Or run it on your own computer.** No installing needed. It's just three files.

1. Click the green **Code** button on this page, then **Download ZIP**.
2. Unzip it.
3. Double-click **`index.html`**. It opens in your web browser and you're ready to go.

Your tasks are saved in your own browser only. Nothing is sent anywhere, and there's no account.

## 📁 What's inside

| File | What it does | Think of it as… |
|---|---|---|
| `index.html` | **What** is on the page: the sidebar, the text box, the lists, the dog | The walls and rooms of a house |
| `style.css` | **How it looks**: colors, fonts, shadows, animations | The paint and decoration |
| `script.js` | **What it does**: adding, saving, filtering, the dog coach | The electricity and plumbing |

Plain HTML, CSS and JavaScript, with no frameworks and no libraries. The code has lots of comments, because I needed them to understand it.

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

---

## 🏷️ Version history

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

- HTML, CSS and JavaScript (no frameworks)
- [Claude Code](https://claude.com/claude-code) as my coding teacher and pair programmer
- Fonts from [Google Fonts](https://fonts.google.com/): Bricolage Grotesque, Geist and Patrick Hand
- Icon shapes from [Lucide](https://lucide.dev/) (ISC license)

## 📄 License

[MIT](LICENSE). You're free to use, copy, change and share this code, even in your own projects. Just keep the license note.

---

*Started 31 October 2026 · Version 0.1 on 1 November 2026 · Made with patience, a lot of questions, and one very good dog.* 🐾
