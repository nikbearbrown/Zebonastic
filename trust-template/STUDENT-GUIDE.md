# How to Reskin a Trust Template with Claude Code

**1. What the template gives you.** The trust template is a working prisoner's dilemma simulation — tournament mechanics, evolution dynamics, sandbox mode, all functional. You don't touch any of that. The math works. The game loop works. What you change is the framing: who the characters are, what they represent in your ethical framework, and how the narrative introduces them. You are building a moral argument on top of a game-theoretic engine.

**2. The one constraint you cannot change.** There are exactly 8 strategy slots: `tft`, `tf2t`, `grudge`, `all_d`, `all_c`, `random`, `pavlov`, `prober`. Each slot defines a fixed behavioral algorithm (tit-for-tat, always defect, etc.). You cannot add a ninth, remove one, or change what a strategy *does*. This is not a technical limitation — it is the design constraint. Each strategy IS an ethical position. Your job is to name it, color it, and narrate it through the lens of your chosen framework. Tit-for-tat doesn't stop being tit-for-tat because you call it "The Proportionalist." That's the point: the behavior is fixed, the interpretation is yours.

**3. The three files you edit.** Everything you need to reskin lives in three places. `game.json` defines the title, description, keywords, and the name/color mapping for each strategy. `words.html` contains all player-facing text — every character introduction, every narrative beat, every label. `assets/` holds images and sounds if you want to swap visual or audio assets (optional, and most students don't).

**4. game.json step-by-step.** Copy `example-game.json` into a new directory (e.g., `my-game/`). Open it. The structure:

```json
{
  "title": "Your Game Title",
  "description": "one-line description for meta tags",
  "keywords": ["your", "keywords", "here"],
  "strategies": {
    "tft":    { "frame": 0, "color": "#4089DD" },
    "all_d":  { "frame": 1, "color": "#52537F" },
    "all_c":  { "frame": 2, "color": "#FF75FF" },
    "grudge": { "frame": 3, "color": "#efc701" },
    "prober": { "frame": 4, "color": "#f6b24c" },
    "tf2t":   { "frame": 5, "color": "#88A8CE" },
    "pavlov": { "frame": 6, "color": "#86C448" },
    "random": { "frame": 7, "color": "#FF5E5E" }
  }
}
```

Change `title`, `description`, and `keywords` to match your GDD. For each strategy, you may change `color` (any hex value). Do not change the strategy key (`tft`, `all_d`, etc.) or `frame` (the sprite sheet index). Example: if your consequentialist framework casts Copycat as "The Proportionalist," change the color to whatever fits your palette and keep the key as `tft`. The name itself goes in `words.html`, not here.

**5. words.html step-by-step.** Open `words.html` in the trust-source directory. Search for character name spans — they look like this:

```html
<span class="tft">Copycat</span>
```

Replace the text between the tags: `<span class="tft">The Proportionalist</span>`. Do this for every occurrence — there are dozens. Search for each strategy class (`tft`, `all_d`, `all_c`, `grudge`, `prober`, `tf2t`, `pavlov`, `random`) and replace every display name consistently. **Warning: do not change the `class` attribute.** The class binds the span to the strategy's color and behavior. Change `class="tft"` to something else and the game breaks silently — the text renders but the color and tournament logic disconnect. Replace only the text content inside the span.

**6. Running the generator.** From the Zebonastic project root:

```
node trust-template/generate.js ./my-game ./trust-source ./public/artifacts/my-game-slug
```

Three positional arguments: your config directory (contains `example-game.json`), the source game directory, and the output path. For Zebonastic deployment, the output goes into `public/artifacts/` — the slug you choose becomes the URL (`/tools/my-game-slug`). The generator copies the source, injects your title/description/keywords into `index.html`, and writes `js/user-config.js` with your strategy colors.

**7. When the build fails.** Copy the full terminal output and paste it into Claude Code with this prompt: "The trust-template generator returned this error. What's wrong with my game.json?" Common failures: malformed JSON (trailing comma, missing quote), wrong config filename (must be `example-game.json` in your config directory), source directory path typo. The generator prints exactly which step failed — read the error before you ask.
