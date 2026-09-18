"use client"

import { useMemo } from "react"
import CodeMirror, { EditorView } from "@uiw/react-codemirror"
import { indentUnit } from "@codemirror/language"
import { python } from "@codemirror/lang-python"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  /** Multiplier applied to the base 12.5px font size / 22px line height, e.g. 1.1 = 110%. */
  fontScale?: number
}

const PYTHON_INDENT = "    "
const BASE_FONT_SIZE = 12.5
const BASE_LINE_HEIGHT = 22

function buildEditorTheme(fontScale: number) {
  return EditorView.theme({
    "&": {
      backgroundColor: "var(--surface-2)",
      color: "var(--text-1)",
      fontSize: `${BASE_FONT_SIZE * fontScale}px`,
      height: "100%",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-content": {
      fontFamily: "var(--font-plex-mono), monospace",
      lineHeight: `${BASE_LINE_HEIGHT * fontScale}px`,
      caretColor: "var(--text-1)",
    },
    ".cm-cursor, .cm-cursor-primary": {
      borderLeft: "1.5px solid var(--text-1)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--surface-2)",
      color: "var(--text-3)",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--accent-soft)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--accent-soft)",
      color: "var(--text-2)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--text-1)",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--surface)",
    },
  })
}

// Muted, high-contrast token colors tuned for the dark surface — deliberately
// restrained (no rainbow) per the design system's "close to a real editor" rule.
const syntaxTheme = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#C792EA" },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#82AAFF" },
    { tag: [tags.string, tags.special(tags.string)], color: "var(--code-string)" },
    { tag: tags.number, color: "#F78C6C" },
    { tag: tags.bool, color: "#F78C6C" },
    { tag: tags.null, color: "#F78C6C" },
    { tag: tags.comment, color: "var(--text-3)", fontStyle: "italic" },
    { tag: [tags.variableName, tags.propertyName], color: "var(--text-1)" },
    { tag: tags.operator, color: "var(--code-operator)" },
    { tag: [tags.punctuation, tags.bracket], color: "var(--text-2)" },
    { tag: tags.typeName, color: "#FFCB6B" },
    { tag: tags.className, color: "#FFCB6B" },
    { tag: tags.definition(tags.variableName), color: "var(--text-1)" },
    { tag: tags.regexp, color: "var(--code-string)" },
  ])
)

export function CodeEditor({ value, onChange, height = "400px", fontScale = 1 }: CodeEditorProps) {
  const editorTheme = useMemo(() => buildEditorTheme(fontScale), [fontScale])

  return (
    <CodeMirror
      value={value}
      height={height}
      theme="none"
      extensions={[python(), indentUnit.of(PYTHON_INDENT), editorTheme, syntaxTheme]}
      onChange={onChange}
      basicSetup={{ tabSize: 4, syntaxHighlighting: false }}
      indentWithTab
      className="h-full overflow-hidden rounded-card border border-border"
    />
  )
}
