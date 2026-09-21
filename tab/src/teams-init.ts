import { app } from '@microsoft/teams-js'

/**
 * Teams tab bootstrap.
 *
 * Teams keeps a tab in a loading state until it calls notifySuccess(), so this
 * has to run on every load. It also tells us which theme the user is in —
 * `prefers-color-scheme` reflects the OS, not the Teams setting, so we stamp
 * data-theme on <html> from the Teams context and keep it in sync.
 *
 * Opened outside Teams (plain browser on https://localhost:53000) initialize()
 * rejects, and we simply fall back to the page's own theme handling.
 */
const applyTheme = (theme: string) => {
  // Teams reports 'default' | 'dark' | 'contrast'. Treat contrast as dark:
  // it is the closer of our two palettes.
  document.documentElement.setAttribute(
    'data-theme',
    theme === 'dark' || theme === 'contrast' ? 'dark' : 'light',
  )
}

app
  .initialize()
  .then(async () => {
    const context = await app.getContext()
    applyTheme(context.app.theme)
    app.registerOnThemeChangeHandler(applyTheme)
    app.notifySuccess()
    document.documentElement.setAttribute('data-host', 'teams')
  })
  .catch(() => {
    // Not hosted in Teams — leave the page's own light/dark handling alone.
    document.documentElement.setAttribute('data-host', 'browser')
  })
