# Move To Improve

Move To Improve is a one-page website for a Movember fundraising initiative focused on movement, community, and wellbeing.

The site provides an overview of the campaign, ways to take part, key events, and information for supporters and sponsors.

## Development

Clone the repository:

```bash
git clone https://github.com/Comonsents/MoveToImprove.git
cd MoveToImprove
```

Then open `index.html` directly in a browser or run it using a local development server such as VS Code Live Server.

### Stylesheets

CSS lives in `css/` and loads through ordinary stylesheet links in `index.html`, with no build step:

- `theme.css`: brand colours, theme variables, and background image references.
- `base.css`: reset, typography, and accessibility helpers.
- `layout.css`: header, navigation, page layout, background squiggle, and footer.
- `components.css`: shared buttons, links, labels, and content patterns.
- `hero.css`: hero layout, photo card, and impact summary.
- `participation.css`: activity cards, flip effects, and expanded dialog.
- `sections.css`: about, events, flagship, impact, partners, and support sections.
- `responsive.css`: tablet/mobile overrides and reduced-motion preferences.

Keep the stylesheet order in `index.html`: shared foundations load first, section styles follow, and responsive overrides load last. Image URLs in CSS are relative to the `css/` directory (for example, `../images/flagship.jpg`). When changing styles, check desktop and mobile layouts, including horizontal overflow.

### Fundraising progress

The background fundraising line and the fundraising totals are driven by `fundraising.json`.
Edit `raised`, `goal`, `currency`, and `updatedAt` to test different progress values. Use an ISO 8601 date and time for `updatedAt`. Run the site through a local development server so the browser can load the JSON file; opening `index.html` directly will show the built-in fallback content instead.

The line fills from top to bottom and stops visually at 100%, while the displayed amount can continue beyond the goal. If the JSON file cannot be loaded or contains invalid values, the page keeps the fallback fundraising goal from `index.html`.

## Status

The website is currently under active development.

See `AGENTS.md` for development conventions, project structure, styling guidance, testing requirements, and Git workflow.
