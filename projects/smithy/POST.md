# Smithy — A Site Builder That Talks Back

I built a tool that lets you create and publish a website just by having a conversation. No code editor, no templates, no setup. You describe what you want, and it builds it — live, on the internet, in seconds.

I'm calling it **Smithy**.

## What it does

You open Smithy, describe the site you want in plain English, and watch it come to life. Want a personal links page? A portfolio? A landing page for your side project? Just say so.

Behind the scenes, Smithy has a conversation with Claude (Anthropic's AI) to generate the HTML and CSS for your site. You see the AI's response in a chat — but the actual code is hidden away. Instead, you get a live preview that updates as the site gets built.

Don't like something? Just say "make the buttons rounder" or "change the color scheme to dark mode" and it updates.

When you're happy with it, hit **Deploy** — and your site is live on the internet with a real URL. No accounts, no hosting setup, no credit card.

## How the deployment works

This was the part that surprised me the most. I assumed the AI would need some special connection to a hosting service, or that deployment would require some kind of agent framework.

It doesn't.

Here's what actually happens when you click Deploy:

1. Your browser sends the generated HTML to the Smithy server
2. The server makes a simple API call to [here.now](https://here.now) (a free hosting service) to reserve a URL
3. The server uploads your HTML file to that URL
4. The server tells here.now "all done, make it live"

That's it. Three HTTP requests. No AI involved in the deployment at all — it's just your server talking to here.now's API like any other web service would.

here.now markets itself as "hosting for agents," but there's nothing agent-specific about it. It's just a clean REST API that's simple enough for anyone (or anything) to use. No authentication required for anonymous publishes, and your site is live in seconds.

You get a claim link so you can take ownership of the site later if you want to keep it around.

## The stack

- **Frontend**: React with Vite
- **Backend**: Express (Node.js)
- **AI**: Claude API via Anthropic's SDK — used only for generating the site code
- **Hosting**: [here.now](https://here.now) — used for deploying the finished sites
- **Storage**: localStorage for now (project history, chat threads)

The whole thing runs as two processes — a Vite dev server for the frontend and an Express server that handles the Claude API calls and deployment.

## What I learned

The interesting takeaway is how little "AI magic" is actually needed to make something like this work. The AI does one thing — generate HTML from a conversation. Everything else (the preview, the deployment, the project management) is just normal web development.

The AI doesn't deploy your site. It doesn't manage hosting. It doesn't even know the site gets deployed. It just writes code when asked, and the rest of the system handles everything else.

Sometimes the most useful AI tools are the ones where the AI does one thing well and gets out of the way.

## Demo

*[Video coming soon]*
