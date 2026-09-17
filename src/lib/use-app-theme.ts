import { useEffect, useState } from "react"

/** Mirrors the app's global data-theme attribute (set on <html> by theme-toggle.tsx) into
 * React state, for components that need to thread it explicitly onto their own root element
 * rather than relying on CSS selectors that only match an ancestor's own attribute. */
export function useAppTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark")

    read()

    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  return theme
}
