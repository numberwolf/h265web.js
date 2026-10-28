# Use h265web.js with an AI coding assistant

[中文](README_CN.md) · [SDK features](../README.MD#feature-matrix) · [Try the player](https://h265web.com/player.php)

A skill is a complete folder of instructions, references and templates for your coding assistant. It helps the assistant build or diagnose an h265web.js player. The browser still loads the SDK's matching JS/WASM assets; a skill is a development tool.

## 1. Choose a skill

| Your task | Skill | What to provide |
| --- | --- | --- |
| New demo or integration in an existing app | [h265web-bootstrap](h265web-bootstrap/SKILL.md) | Framework/version, SDK location, media URL or local sample, requested controls |
| Black picture, no sound, loading errors, inactive SR, cleanup problems | [h265web-troubleshoot](h265web-troubleshoot/SKILL.md) | Browser/version, failing action, actual SDK URL, relevant console/network evidence |

Bootstrap includes plain JS, React, Vue, Svelte, Angular, Next and Nuxt templates. Both skills understand stable volume and experimental SDR super resolution, their runtime controls and actual availability. They preserve your app's existing framework and lifecycle.

## 2. Install the complete folders

**Codex: paste this into a conversation, rather than a terminal.**

```text
Use $skill-installer to install both skills from these GitHub directories:
https://github.com/numberwolf/h265web.js/tree/master/skills/h265web-bootstrap
https://github.com/numberwolf/h265web.js/tree/master/skills/h265web-troubleshoot
```

**Manual / project-local setup:** download this repository using GitHub's **Code → Download ZIP**, or clone it. Copy the entire `h265web-bootstrap` and `h265web-troubleshoot` folders into your project's `.agents/skills/` directory for Codex. Keep every `references/`, `scripts/`, `assets/` and `agents/` file. If a destination already exists, compare versions before replacing it.

```text
my-project/
  .agents/skills/
    h265web-bootstrap/
      SKILL.md
      references/  scripts/  assets/  agents/
    h265web-troubleshoot/
      SKILL.md
      references/  scripts/  agents/
```

For other assistants, use their documented local Agent Skills directory/import mechanism and the same complete folders. Check that both skill names appear in the assistant's skill list. If Codex does not detect them, restart it. See [official Codex skill discovery and invocation](https://developers.openai.com/codex/skills/).

## 3. Send a task to the assistant

In Codex CLI/IDE, use `$` or `/skills` to select a skill. In an app with a skill picker, select it there. You can also explicitly ask the assistant to use its installed name.

**Build or integrate:**

```text
Use $h265web-bootstrap to integrate h265web.js into my React project.
Read the existing project before changing it. Use its configured SDK and media URL.
Add play/pause, stable-volume and experimental SDR super-resolution switches.
SR should initially choose one available step up, with Automatic as an option.
Preserve volume/mute, handle component cleanup/recreation and verify actual playback.
```

**Diagnose:**

```text
Use $h265web-troubleshoot to investigate why this player has no sound
or why super resolution stays in bypass. Inspect actual loaded resources,
audio tracks, user activation and the SDK's status/reason first.
Make the smallest necessary fix and retest the original action.
```

Replace the framework and source with your own project details. Do not paste secret tokens or unredacted authorization headers into public reports.

## 4. What the assistant should deliver

Changed files, startup command/URL, SDK/media configuration and actual playback checks, including relevant pause/seek/release/rebuild behavior. For enhancements, report actual processing/output or the bypass reason. Both effects start off; SR needs compatible SDR, model assets, display demand and GPU support. Recreating a renderer is an explicit action.

[Runtime controls and limits](https://h265web.com/markdown-docs/playback-enhancements.php) · [API reference](https://h265web.com/markdown-docs/api-docs.php)
