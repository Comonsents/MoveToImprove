# Move To Improve

Move To Improve is a static website for a Movember fundraising initiative focused on movement, community, and wellbeing.

The site provides an overview of the campaign, ways to take part, key events, and information for supporters and sponsors.

The homepage lives in `index.html`. The About page in `about.html` shares the site’s stylesheets and tells the story behind the campaign. Its navigation links return to the relevant homepage sections. Keep shared navigation and footer changes consistent across both pages.

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

The background fundraising line and totals read the current amount from cell `A1` in the shared Google Sheet [Website Fundraising Total](https://docs.google.com/spreadsheets/d/1PCS5-EEhQ_InzL-0DR8b07jGTD4Ugvkp6EgN6dqRTa8/edit). The goal is fixed at NZD 50,000 in `script.js`, and the website creates the displayed update time after it successfully receives the Sheet value.

The Sheet's read endpoint must remain publicly accessible, although editing can stay restricted to the campaign team. If Google Sheets cannot be reached, the site uses the `raised` amount in `fundraising.json`; if that also fails, it keeps the fallback fundraising goal from `index.html`. The line fills from top to bottom and stops visually at 100%, while the displayed amount can continue beyond the goal.

## Status

The website is currently under active development.

See `AGENTS.md` for development conventions, project structure, styling guidance, testing requirements, and Git workflow.
