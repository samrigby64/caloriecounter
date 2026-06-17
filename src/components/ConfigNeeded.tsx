/** Shown when the app hasn't been pointed at a Supabase project yet.
 *  Gives the user the exact steps instead of a blank white screen. */
export default function ConfigNeeded() {
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-bold text-brand">Almost there</h1>
      <p className="mt-2 text-muted">
        The app needs a free Supabase project to store your data and sync across
        devices. It only takes a couple of minutes.
      </p>
      <ol className="mt-6 space-y-3 text-sm leading-relaxed">
        <li>
          1. Create a free project at{' '}
          <a
            className="text-brand underline"
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          .
        </li>
        <li>
          2. In the project's <b>SQL Editor</b>, run the script in{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5">
            supabase/schema.sql
          </code>
          .
        </li>
        <li>
          3. From <b>Project Settings → API</b>, copy the <b>Project URL</b> and{' '}
          <b>anon public key</b>.
        </li>
        <li>
          4. Put them in a{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5">.env</code> file
          (copy <code className="rounded bg-surface-2 px-1.5 py-0.5">.env.example</code>
          ) and restart the dev server.
        </li>
      </ol>
      <pre className="mt-6 overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs text-muted">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
      </pre>
    </div>
  )
}
