## Branching Workflow

```text
frontend  ┐
          ├── alpha ─── main ─── Vercel deployment
database  ┘
```

This project uses separate branches to keep development organized before deploying changes to the live website.

### `frontend`

The `frontend` branch is used for frontend-related work, including:

- HTML pages
- CSS styling
- client-side JavaScript
- page layout and user interface changes
- forms, buttons, and visual improvements

### `database`

The `database` branch is used for database-related work, including:

- Supabase table setup
- SQL schema changes
- Row Level Security policies
- seed data
- database-related documentation

### `alpha`

The `alpha` branch is the main development/testing branch.

Work from feature branches such as `frontend` and `database` should first be merged into `alpha`. This allows changes to be reviewed and tested before they are added to the production branch.

### `main`

The `main` branch is the production branch.

This branch is connected to Vercel, so any changes pushed or merged into `main` may trigger a deployment to the live website.


## Project Structure

```text
world-cup-predictions/
│
├── api/
├── public/
├── sql/
├── .env.local
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

### `api/`

Contains Vercel serverless functions. These files run on the server, not in the browser. Use this folder for logic that should be protected, such as calling the football API with a secret API key or updating the database with match results.

#### `api/sync-matches.js`

Fetches upcoming matches and match results from the football API. It then inserts or updates the `matches` table in Supabase. This file should use environment variables for private API keys.

#### `api/calculate-points.js`

Calculates points for users based on their predictions and the final match results. This can be called after match results are updated, either manually from the admin page or automatically after syncing matches.

---

### `public/`

Contains the frontend files that are served to users. These files run in the browser.

#### `public/index.html`

Landing page and/or login page. Users can sign up, log in, or navigate to the main parts of the app.

#### `public/matches.html`

Displays the list of World Cup matches. Users can view upcoming games, enter score predictions, and see finished results.

#### `public/leaderboard.html`

Displays the leaderboard, showing users ranked by total points.

#### `public/rules.html`

Explains how the prediction game works, including the scoring system and prediction deadlines.

#### `public/admin.html`

Admin page for protected actions, such as syncing matches from the football API, recalculating points, or checking match data.

---

### `public/css/`

Contains styling files for the frontend.

#### `public/css/styles.css`

Main stylesheet for the website. It should include layout, colors, buttons, forms, tables, mobile responsiveness, and general page styling.

---

### `public/js/`

Contains frontend JavaScript files. These files handle user interaction, Supabase queries, page rendering, and form logic.

#### `public/js/config.js`

Stores public frontend configuration, such as the Supabase project URL and Supabase anon key.

Do not store private keys here.

#### `public/js/supabase-client.js`

Creates and exports the Supabase client so it can be reused across the frontend JavaScript files.

#### `public/js/auth.js`

Handles authentication-related logic, such as sign up, login, logout, checking the current user, and loading the user profile.

#### `public/js/matches.js`

Handles loading and displaying matches from Supabase. It should show match information such as teams, kickoff time, status, and final score.

#### `public/js/predictions.js`

Handles prediction logic. This includes saving predictions, updating predictions before kickoff, loading existing predictions, and preventing users from editing predictions after the deadline.

#### `public/js/leaderboard.js`

Handles loading and displaying leaderboard data. It should calculate or retrieve users’ total points and display rankings.

#### `public/js/admin.js`

Handles admin-only frontend actions, such as triggering the match sync function or recalculating points.

#### `public/js/utils.js`

Contains shared helper functions used across the app, such as date formatting, score validation, error handling, loading states, and reusable display functions.

---

### `public/assets/`

Contains static assets used by the frontend.

#### `public/assets/images/`

Stores images used on the site, such as banners, background images, or country/team-related visuals.

#### `public/assets/icons/`

Stores icons used in the interface, such as football icons, navigation icons, or small UI graphics.

---

### `sql/`

Contains SQL files used to set up and document the Supabase database. These files are not used directly by the browser. They can be run in the Supabase SQL editor.

#### `sql/schema.sql`

Creates the main database tables, such as `profiles`, `matches`, and `predictions`.

#### `sql/policies.sql`

Defines Supabase Row Level Security policies. These rules control what users are allowed to read, insert, update, or delete.

#### `sql/seed-matches.sql`

Optional file for inserting initial match data into the database. This may be useful for testing before the football API sync is working.

---

### `.env.local`

Stores local environment variables for development, such as private API keys and Supabase server-side keys.

This file should not be committed to GitHub.

Example values:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FOOTBALL_API_KEY=your_football_api_key
```

---

### `.gitignore`

Lists files and folders that should not be committed to GitHub, such as `.env.local`, `node_modules/`, and temporary files.

---

### `package.json`

Defines project metadata, dependencies, and scripts. It is used by Node.js and Vercel to understand how to run the project.

It may include dependencies such as Supabase and development tools such as the Vercel CLI.

---

### `vercel.json`

Optional Vercel configuration file. It can define clean URL rewrites and scheduled cron jobs.

For example, it can map `/matches` to `matches.html` or schedule `/api/sync-matches` to run automatically.

---

### `README.md`

Main project documentation. It should explain what the project does, how to set it up, how the folder structure works, and how to run or deploy the app.