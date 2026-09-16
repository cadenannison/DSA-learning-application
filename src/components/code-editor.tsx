"use client"

import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="400px"
      extensions={[javascript()]}
      onChange={onChange}
      basicSetup={{ tabSize: 2 }}
      className="text-sm border border-border rounded-md overflow-hidden"
    />
  )
}
