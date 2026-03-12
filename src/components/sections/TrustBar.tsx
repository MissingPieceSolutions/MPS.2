const PARTNERS = [
  'OpenAI', 'Anthropic', 'Gemini', 'n8n', 'Zapier',
  'Make', 'Python', 'TypeScript', 'Supabase', 'Cloudflare',
];

export function TrustBar() {
  return (
    <section className="py-8 overflow-x-auto">
      <div className="flex gap-8 px-6 justify-center flex-wrap">
        {PARTNERS.map((name) => (
          <span
            key={name}
            className="text-xs font-mono uppercase tracking-widest text-accent/70 whitespace-nowrap"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
