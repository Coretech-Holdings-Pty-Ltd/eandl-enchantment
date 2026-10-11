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

- Shared corporate navigation and footer live in a reusable SiteLayout; each content area has its own TanStack file route for direct navigation.
- Public company and package data is defined in a browser-safe content module, keeping pricing and descriptions consistent across pages.
- Contact enquiries prepare an email to the published company address; do not imply a message was sent without a connected delivery service.
- Client access remains a clearly labelled access-request page until a real client portal destination is supplied; do not create fake sign-in or client records.
