# Tale Steward

A private, browser-based manuscript and story-bible workspace for an individual writer.

## Version 1 features

- Create separate story/manuscript projects
- Add scenes, summaries, manuscript text, and revision notes
- Track character details, motivations, relationships, and notes
- Build a world bible for locations, systems, objects, and research
- Search manuscript text and reference records
- Use a human-centered continuity review with character-presence checks and editorial prompts
- Export and import project backups as JSON files

## Privacy

Version 1 uses your browser's local storage. It has no account system, database, analytics, or AI API connection. Your work stays in the browser on the device you use unless you export a backup file. Export regularly, especially before clearing browser data or switching devices.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Vercel should recognize it as a Vite project.
3. Leave the default build command as `npm run build` and output directory as `dist`.
4. Deploy from the `main` branch.

No environment variables are required for Version 1.
