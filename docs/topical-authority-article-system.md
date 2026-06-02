# Topical Authority Article System

This template uses articles to support the directory, not to publish random blog posts. Every article should belong to a cluster, link back to useful directory pages, and be tracked so the same topic is not created twice.

## Workflow

1. Build the topical map before creating articles.
2. Start with core topic authority pages, such as "what is the food/category?" and "how the topic works in the target city".
3. Add cuisine, dish, service, and comparison explainers that deepen the subject.
4. Add local context articles that connect the topic to areas, neighbourhoods, and strong directory hubs.
5. Add visitor-intent articles for choosing, comparing, booking, takeaway, dietary needs, and groups.
6. Keep all generated articles as drafts until reviewed.

## Tracker

The tracker lives in `content/article-plan.json`. Each item records the cluster, target keyword, priority, status, planned date, internal links, research notes path, draft path, and similar topic warnings.

Allowed statuses are:

- `idea`
- `planned`
- `researched`
- `drafted`
- `reviewed`
- `scheduled`
- `published`
- `skipped`

Only `planned` items are eligible for the next draft workflow. Items that already have an article file are skipped by the selector.

## Live Search Research

Before a draft is created, the workflow searches the live web for the target keyword and saves notes in `content/research`. These notes should summarize recurring competitor themes, common headings, related questions, missing local angles, and internal link opportunities.

The generated draft must use the research as a brief. It must not copy competitor wording.

## Publishing Rule

Drafts are stored in `content/articles`, but only articles with `status: "published"` appear on `/guides`, `/guides/[slug]`, and the sitemap.

## Scheduling Plan

After manual draft generation is verified, create a Codex automation that runs twice per day and asks for two draft articles. The automation should run the article workflow, keep output as drafts, and report when the planned queue needs more topics.
