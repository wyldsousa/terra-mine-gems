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
