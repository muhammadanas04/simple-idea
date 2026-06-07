import type React from "react";

type AgentActionCardProps = {
  title: string;
  description: string;
  endpoint: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  result: any;
  children: React.ReactNode;
};

export default function AgentActionCard({
  title,
  description,
  endpoint,
  onSubmit,
  submitting,
  result,
  children,
}: AgentActionCardProps) {
  return (
    <section className="bg-white p-5 rounded-[14px] shadow-soft space-y-4 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-hover">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-navy-text flex items-center gap-1.5">
            {title}
          </h3>
          <p className="text-[11px] text-muted-text leading-normal">
            {description}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {children}
          <div className="text-[10px] text-muted-text font-semibold">
            Endpoint:{" "}
            <span className="font-mono bg-lavender-bg/50 px-1 py-0.5 rounded text-navy-text">
              {endpoint}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-95 disabled:opacity-50 cursor-pointer transition-all duration-200"
          >
            {submitting ? "Executing API Call..." : "Run Agent Action"}
          </button>
        </form>
      </div>

      {result && (
        <div className="mt-3 pt-3 border-t border-lavender-bg/40 space-y-1.5 animate-slide-down">
          <div className="flex items-center justify-between text-[9px] font-bold">
            <span className="text-muted-text">API RESPONSE</span>
            {result.ms_taken && (
              <span className="text-accent-violet">{result.ms_taken} ms</span>
            )}
          </div>
          <pre className="text-[9px] text-navy-text font-mono bg-lavender-bg/30 p-2.5 rounded-lg max-h-[160px] overflow-auto border border-lavender-bg/10">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
