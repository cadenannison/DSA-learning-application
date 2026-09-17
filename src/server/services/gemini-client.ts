const GEMINI_MODEL = "gemini-3.6-flash"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export class GeminiClientError extends Error {}

/** Thin wrapper over the Gemini REST API (plain fetch — no SDK dependency). Only does one
 * thing: send a prompt, get back the model's raw text response. Callers are responsible for
 * instructing the model to emit JSON and for validating what comes back — this class doesn't
 * know about study plans. */
export class GeminiClient {
  constructor(private readonly apiKey: string) {}

  async generateJson(prompt: string): Promise<unknown> {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new GeminiClientError(`Gemini request failed (${response.status}): ${body}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== "string") {
      throw new GeminiClientError("Gemini response had no text content")
    }

    try {
      return JSON.parse(text)
    } catch {
      throw new GeminiClientError("Gemini response was not valid JSON")
    }
  }
}
