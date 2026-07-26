# Hugo content templates

Create future content with Hugo's archetypes:

```powershell
hugo new articles/my-article.md
hugo new projects/my-project.md
```

The section templates render the same article/documentation card structure as the static site, including cover images and vertical reading progress. The current stylesheet, script, and default cover assets are already included under `static/`.

Each new article automatically receives the article sidebar from `layouts/partials/article-sidebar.html`. Use `date`, `category`, `tags`, and `readTime` in its front matter.

Each new project automatically receives the project sidebar from `layouts/partials/project-sidebar.html`. Use `status`, `role`, `timeline`, `tech`, `github`, `demo`, and `documentation` in its front matter. Both sidebars generate their table of contents from H2/H3 headings.
