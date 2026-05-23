# Supabase Account Sync Setup

This template can run without Supabase. If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, visitors can still save and compare listings in their browser.

## 1. Create the Supabase project

Create a Supabase project for this directory, then copy:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Add those values to your local `.env.local` and to your production host.

## 2. Create the tables and policies

Open the Supabase SQL editor and run the contents of:

```txt
supabase-schema.sql
```

The schema stores saved listings and private notes per user. Row-level security keeps each user's data private.

## 3. Enable sign-in providers

In Supabase Auth providers, enable:

- Google
- Azure / Microsoft
- Email magic links

For local development, add this redirect URL:

```txt
http://localhost:3000
```

If you run the template on another local port, add that exact origin too, for example:

```txt
http://localhost:3001
```

For production, add the public site origin:

```txt
https://your-domain.example
```

## 4. Reusing the template

For a new directory copy, either create a separate Supabase project or use table names/policies that isolate that directory. A separate project is simplest and avoids saved restaurants from one directory appearing in another.
