export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">MPS</h1>
        <p className="text-text-muted">Next.js scaffold working.</p>
        <div className="flex gap-4 justify-center">
          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-mono">
            Tailwind OK
          </span>
          <span className="px-3 py-1 rounded-full bg-surface text-text-muted text-sm font-mono">
            Tokens OK
          </span>
        </div>
      </div>
    </main>
  );
}
