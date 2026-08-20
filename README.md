# One-page campaign website

Open `index.html` in a browser to preview the site.

## Replace
- `YOUR PROJECT` with the project/fundraiser name.
- Placeholder body copy with the real content.
- Stats with real numbers.
- `hello@example.com` with the real contact/donation destination.

## Squarespace
The visual system can be recreated in Squarespace using normal sections/blocks, while the squiggle can be inserted as inline SVG in a Code Block. The CSS/JS here is also a useful reference for the custom-code portions.


## Theme colours
All major colours are controlled from the `:root` block at the top of `styles.css`.
The main values are:
- `--colour-ink`
- `--colour-paper`
- `--colour-accent-1` through `--colour-accent-5`

Card colours use `--card-1` through `--card-5`, so you can also change individual card assignments without touching the components.

## Layout
The “What we do” section now contains five cards. On larger screens it uses a 2 + 3 layout; on tablet it becomes two columns; on mobile it stacks into one column.
