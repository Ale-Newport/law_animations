# Third-party resources

No third-party fonts, graphic assets or external skill files are redistributed in this kit. The two custom skills, planning utilities and visual briefs were prepared for this request. The included source links identify optional tools that the user may separately install under their own terms.

When Claude builds the actual animation library, it must maintain a manifest of every third-party dependency and asset, including source, version, licence and required notices. Do not invent an asset licence or assume attribution is sufficient. Select the licence for the resulting user project deliberately; this starter does not change the licence of an existing project.

## Manifest (maintained during implementation)

### Runtime dependencies of the animation library
None. `src/` (core runtime, primitives, frameworks and every animation module) is original code with no third-party imports, and all artwork is original vector geometry written in code. No fonts, icons, images, sounds or remote assets are embedded or loaded; text uses the system font stack declared in `src/core/text.js`.

### Development-only dependencies (not shipped with the animations)
| Package | Version | Licence | Use |
|---|---|---|---|
| @playwright/test | 1.63.0 | Apache-2.0 | local browser tests and QA captures |
| playwright | 1.63.0 | Apache-2.0 | (dependency of @playwright/test) |
| playwright-core | 1.63.0 | Apache-2.0 | (dependency of @playwright/test) |

The Chromium build used by Playwright (revision 1243) is installed in the user's Playwright cache, not in this project. See each package's own LICENSE/NOTICE files in `node_modules/` for the full terms.

### Project skill
`.claude/skills/frontend-design/` is a third-party skill installed by the user (see `skills-lock.json`, source `anthropics/skills`, with its own `LICENSE.txt`). It is guidance only and is not part of the animation runtime.
