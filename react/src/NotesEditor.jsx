// THE NOTES EDITOR: a notes box you can format (sizes, colors, lists, tables...), with a
// toolbar along its bottom edge. Used in a task card's panel and under the new-task box.
//
// The editing itself is done by TipTap (https://tiptap.dev), a library built on ProseMirror.
// TipTap only keeps what its "extensions" know about (paragraphs, lists, tables, bold...),
// so anything else in pasted text or a backup file, like a <script>, is simply dropped.
// The note is saved as HTML text, e.g. "<p>Buy <strong>milk</strong></p>"
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BulletList, TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import Icon from "./Icon.jsx";
import { notesToHtml } from "./tasks.js";

// Bullet lists with a choice of bullet: dot, circle or square.
// "extend" makes a copy of TipTap's bullet list with one more setting, saved as data-style="circle"
const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: "disc",
        parseHTML: (element) => element.getAttribute("data-style") || "disc",
        renderHTML: (attributes) => ({ "data-style": attributes.listStyle })
      }
    };
  }
});

// Everything the notes can contain. StarterKit brings paragraphs, headings, bold, italic,
// underline, strike, numbered lists and undo/redo; we switch off the parts we don't use
const EXTENSIONS = [
  StarterKit.configure({ bulletList: false, link: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false }),
  StyledBulletList,
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  TextStyle,
  Color,
  FontSize,
  Highlight.configure({ multicolor: true }),
  Placeholder.configure({ placeholder: "Add notes or links" })
];

// The colors are the app's own color names (CSS variables), not fixed colors,
// so dark mode can swap in a lighter version and the text stays readable
const TEXT_COLORS = [
  { name: "Red", value: "var(--note-red)" },
  { name: "Green", value: "var(--note-green)" },
  { name: "Blue", value: "var(--note-blue)" },
  { name: "Purple", value: "var(--note-purple)" },
  { name: "Grey", value: "var(--muted)" }
];

const HIGHLIGHTS = [
  { name: "Butter", value: "var(--butter)" },
  { name: "Mint", value: "var(--mint)" },
  { name: "Pink", value: "var(--pink)" },
  { name: "Blue", value: "var(--blue)" },
  { name: "Lavender", value: "var(--lavender)" }
];

// One toolbar button. onMouseDown + preventDefault: pressing it doesn't take the cursor out
// of the note, so the formatting lands on the text you selected
function ToolButton({ icon, label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      className={active ? "tool on" : "tool"}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

// A row of color swatches, plus "none" to take the color off
function Swatches({ label, colors, onPick, onNone }) {
  return (
    <div className="swatches" role="group" aria-label={label}>
      <button type="button" className="swatch swatch-none" title="None" aria-label="None" onMouseDown={(event) => event.preventDefault()} onClick={onNone}>
        <Icon name="x" />
      </button>
      {colors.map((color) => (
        <button
          type="button"
          key={color.name}
          className="swatch"
          title={color.name}
          aria-label={color.name}
          style={{ "--swatch": color.value }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(color.value)}
        />
      ))}
    </div>
  );
}

// value: the note (HTML, or an old plain note). onChange(html) gets every change ("" when empty)
export default function NotesEditor({ value, onChange, label, className }) {
  const [menu, setMenu] = useState("");   // which swatch row is open: "color", "highlight" or ""

  // The newest onChange, kept in a ref: the editor is made once, and would otherwise
  // keep calling the onChange from the first draw
  const changed = useRef(onChange);
  useEffect(function () {
    changed.current = onChange;
  });

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: notesToHtml(value),
    shouldRerenderOnTransaction: true,   // redraw the toolbar as the cursor moves (to light up B, I...)
    editorProps: { attributes: { class: "rich-text", "aria-label": label, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => changed.current(editor.isEmpty ? "" : editor.getHTML())
  });

  if (!editor) {
    return null;
  }

  // Shortcut: editor.chain().focus() starts every command, and .run() carries it out
  const run = () => editor.chain().focus();

  const size = editor.getAttributes("textStyle").fontSize || "";
  let style = "p";
  if (editor.isActive("heading", { level: 2 })) {
    style = "h2";
  } else if (editor.isActive("heading", { level: 3 })) {
    style = "h3";
  }

  function chooseStyle(choice) {
    if (choice === "p") {
      run().setParagraph().run();
    } else {
      run().setHeading({ level: choice === "h2" ? 2 : 3 }).run();
    }
  }

  function chooseSize(choice) {
    if (choice === "") {
      run().unsetFontSize().run();
    } else {
      run().setFontSize(choice).run();
    }
  }

  function toggleMenu(name) {
    setMenu(menu === name ? "" : name);
  }

  return (
    <div className={"rich-notes " + (className || "")}>
      <EditorContent editor={editor} />

      {/* Table tools: only while the cursor is inside a table */}
      {editor.isActive("table") && (
        <div className="table-tools" role="group" aria-label="Table">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => run().addRowAfter().run()}>+ Row</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => run().addColumnAfter().run()}>+ Column</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => run().deleteRow().run()}>− Row</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => run().deleteColumn().run()}>− Column</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => run().deleteTable().run()}>Delete table</button>
        </div>
      )}

      {menu === "color" && (
        <Swatches
          label="Text color"
          colors={TEXT_COLORS}
          onPick={(color) => run().setColor(color).run()}
          onNone={() => run().unsetColor().run()}
        />
      )}
      {menu === "highlight" && (
        <Swatches
          label="Highlight"
          colors={HIGHLIGHTS}
          onPick={(color) => run().setHighlight({ color }).run()}
          onNone={() => run().unsetHighlight().run()}
        />
      )}

      {/* THE TOOLBAR, along the bottom edge of the box */}
      <div className="rich-toolbar" role="toolbar" aria-label="Formatting">
        <ToolButton icon="undo" label="Undo" disabled={!editor.can().undo()} onClick={() => run().undo().run()} />
        <ToolButton icon="redo" label="Redo" disabled={!editor.can().redo()} onClick={() => run().redo().run()} />
        <span className="tool-gap"></span>

        <select className="tool-select" aria-label="Paragraph style" title="Paragraph style" value={style} onChange={(event) => chooseStyle(event.target.value)}>
          <option value="p">Text</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>
        <select className="tool-select" aria-label="Text size" title="Text size" value={size} onChange={(event) => chooseSize(event.target.value)}>
          <option value="0.85em">Small</option>
          <option value="">Medium</option>
          <option value="1.25em">Large</option>
        </select>
        <span className="tool-gap"></span>

        <ToolButton icon="bold" label="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => run().toggleBold().run()} />
        <ToolButton icon="italic" label="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => run().toggleItalic().run()} />
        <ToolButton icon="underline" label="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => run().toggleUnderline().run()} />
        <ToolButton icon="strikethrough" label="Strikethrough" active={editor.isActive("strike")} onClick={() => run().toggleStrike().run()} />
        <span className="tool-gap"></span>

        <ToolButton icon="baseline" label="Text color" active={menu === "color"} onClick={() => toggleMenu("color")} />
        <ToolButton icon="highlighter" label="Highlight" active={menu === "highlight"} onClick={() => toggleMenu("highlight")} />
        <span className="tool-gap"></span>

        <ToolButton icon="list" label="Bullet list" active={editor.isActive("bulletList")} onClick={() => run().toggleBulletList().run()} />
        {editor.isActive("bulletList") && (
          <select
            className="tool-select"
            aria-label="Bullet style"
            title="Bullet style"
            value={editor.getAttributes("bulletList").listStyle || "disc"}
            onChange={(event) => run().updateAttributes("bulletList", { listStyle: event.target.value }).run()}
          >
            <option value="disc">• Dot</option>
            <option value="circle">◦ Circle</option>
            <option value="square">▪ Square</option>
          </select>
        )}
        <ToolButton icon="list-ordered" label="Numbered list" active={editor.isActive("orderedList")} onClick={() => run().toggleOrderedList().run()} />
        {editor.isActive("orderedList") && (
          <select
            className="tool-select"
            aria-label="Numbering style"
            title="Numbering style"
            value={editor.getAttributes("orderedList").type || "1"}
            onChange={(event) => run().updateAttributes("orderedList", { type: event.target.value }).run()}
          >
            <option value="1">1, 2, 3</option>
            <option value="a">a, b, c</option>
            <option value="i">i, ii, iii</option>
          </select>
        )}
        <ToolButton icon="list-todo" label="Checklist" active={editor.isActive("taskList")} onClick={() => run().toggleTaskList().run()} />
        <span className="tool-gap"></span>

        <ToolButton icon="table" label="Insert a table" disabled={editor.isActive("table")} onClick={() => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <ToolButton icon="remove-formatting" label="Clear formatting" onClick={() => run().unsetAllMarks().clearNodes().run()} />
      </div>
    </div>
  );
}
