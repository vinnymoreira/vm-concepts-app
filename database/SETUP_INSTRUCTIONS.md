# Project Manager Setup Instructions

## Database Setup

You need to run the SQL migration to add the new fields to your projects table.

### Step 1: Run Migration (If table already exists)

If you already created the `projects` table, run this migration in Supabase SQL Editor:

```sql
-- Add domain column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add staging_site column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS staging_site TEXT;
```

### Step 2: Or Create Fresh Table

If you haven't created the table yet, run the entire schema from `database/projects_schema.sql` in Supabase SQL Editor.

## What's New

### Changes Implemented:

1. **Layout Changes:**
   - ✅ Projects are now grouped by VMC Client with headings
   - ✅ Removed VMC Client column from the table
   - ✅ Each client section has its own table

2. **Expanded Row Layout:**
   - ✅ Trello and Design Links in a two-column layout (Row 1)
   - ✅ Domain and Staging Site in a two-column layout (Row 2)
   - ✅ Removed "Website" field, replaced with "Domain"
   - ✅ Added new "Staging Site" field

3. **Styling Updates:**
   - ✅ Changed profit color from violet to standard gray in the table
   - ✅ Total Profit summary card now shows in green
   - ✅ Total Profit only counts paid projects
   - ✅ Modal shows "Estimated Profit" in green
   - ✅ Estimated Profit appears as text (not an input field)

4. **Database Schema:**
   - ✅ Added `domain` field (TEXT)
   - ✅ Added `staging_site` field (TEXT)
   - ✅ Kept backward compatibility

## Features:

- **Table Layout** with sortable columns
- **Inline Editing** - click any field to edit
- **Client Grouping** - projects organized by client
- **Financial Summary** - dashboard showing totals, paid projects, revenue, and profit
- **Status Management** - Open, In Progress, QA, Complete
- **Assignment Tracking** - You or Brazil Team
- **Payment Tracking** - Yes/No toggle
- **Auto-calculated Profit** - Net Income minus Cost
- **Expandable Details** - Click arrow to see links and additional info
- **Search & Filtering** - Filter by status and assignment
- **Dark Mode Support** - Full theme support

## Navigation:

The Projects section is now available in the sidebar between "Clients" and "Fitness".

Access it at: `/projects`
