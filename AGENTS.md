<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Atlas calendar-event accounting and one-time saved-parameter migration isolated in its own calculation module; Fortune retains its existing event projection behavior.
- Identify game-specific calculation behavior through parameter game identity, not editable event names, so player settings cannot select the wrong engine.
- Public rankings use a narrowly projected SQL RPC that enforces opt-in and per-field consent; raw profile/stat rows are owner-readable only to prevent bypassing privacy in direct requests.
- Debounce changed calculator summaries globally, compare before writing, and poll cached public snapshots only while visible; preserve remote summaries on a device with no local game data.
- Store each calculator's real daily, weekly and annual projection in public summaries; never derive Atlas annual income by multiplying its monthly estimate.
- Land Rents is a separate placeholder mode and route, excluded from calculator engines and ranking game identifiers.
