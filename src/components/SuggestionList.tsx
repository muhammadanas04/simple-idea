import React, { useState } from "react";
import RatingBadge from "./RatingBadge";

type SuggestionType = {
  id: string;
  content: string;
  suggestedBy: string;
  avgRating: number;
  ratingCount: number;
};

type SuggestionListProps = {
  ideaId: string;
  suggestions: SuggestionType[];
  onRefresh: () => void;
};

export default function SuggestionList({
  ideaId,
  suggestions: initialSuggestions,
  onRefresh,
}: SuggestionListProps) {
  const [activeRatingId, setActiveRatingId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [score, setScore] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitRating = async (suggestionId: string) => {
    if (!agentName.trim()) {
      setError("Please enter your name/handle");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/ideas/${ideaId}/suggestions/${suggestionId}/rate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rated_by: agentName.trim(),
            score: score,
          }),
        },
      );

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      setActiveRatingId(null);
      setAgentName("");
      setScore(50);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Error submitting rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wider text-navy-text uppercase opacity-75">
        Suggestions
      </h3>
      {initialSuggestions.length === 0 ? (
        <p className="text-sm text-muted-text italic">
          No suggestions added yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {initialSuggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="p-3 bg-lavender-bg/40 rounded-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-navy-text">
                    {suggestion.content}
                  </p>
                  <p className="text-xs text-muted-text">
                    Suggested by{" "}
                    <span className="font-semibold text-accent-violet">
                      {suggestion.suggestedBy}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RatingBadge score={suggestion.avgRating} size="sm" />
                  <span className="text-xs text-muted-text">
                    ({suggestion.ratingCount} ratings)
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (activeRatingId === suggestion.id) {
                      setActiveRatingId(null);
                    } else {
                      setActiveRatingId(suggestion.id);
                      setError(null);
                    }
                  }}
                  className="px-2.5 py-1 bg-accent-light text-accent-violet rounded-full text-[10px] font-bold hover:bg-opacity-80 transition-all flex items-center gap-1 cursor-pointer focus:outline-none"
                >
                  <span className="inline-flex items-center justify-center w-3 h-3 text-[9px]">
                    ★
                  </span>
                  Rate suggestion
                </button>
              </div>

              {activeRatingId === suggestion.id && (
                <div className="mt-2 p-3 bg-white rounded-lg shadow-soft space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`sug-rate-name-${suggestion.id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id={`sug-rate-name-${suggestion.id}`}
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="User or agent name"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`sug-rate-score-${suggestion.id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Score: {score}/100
                      </label>
                      <input
                        type="range"
                        id={`sug-rate-score-${suggestion.id}`}
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="w-full accent-accent-violet mt-2 cursor-pointer"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-[10px] text-red-500 font-medium">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRatingId(null)}
                      className="text-[10px] font-bold px-2.5 py-1 bg-lavender-bg/60 text-navy-text rounded hover:bg-lavender-bg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitRating(suggestion.id)}
                      className="text-[10px] font-bold px-3 py-1 bg-navy-dark text-white rounded hover:bg-opacity-90 disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
