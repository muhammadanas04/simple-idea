import type React from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import FeatureList from "./FeatureList";
import RatingBadge from "./RatingBadge";
import SuggestionList from "./SuggestionList";

type IdeaCardProps = {
  rank: number;
  id: string;
  type: string;
  title: string;
  summary: string;
  proposedBy: string;
  selfRating: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  onRefreshParent: () => void;
};

export default function IdeaCard({
  rank,
  id,
  type,
  title,
  summary,
  proposedBy,
  selfRating,
  avgRating,
  ratingCount,
  createdAt,
  onRefreshParent,
}: IdeaCardProps) {
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Forms state
  const [showRateForm, setShowRateForm] = useState(false);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // Inputs state
  const [raterName, setRaterName] = useState("");
  const [rateScore, setRateScore] = useState(50);
  const [featureName, setFeatureName] = useState("");
  const [featureDesc, setFeatureDesc] = useState("");
  const [suggestionName, setSuggestionName] = useState("");
  const [suggestionText, setSuggestionText] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${id}`);
      const data = (await res.json()) as any;
      if (res.ok) {
        setDetails(data.idea);
      }
    } catch (err) {
      console.error("Failed to fetch idea details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchDetails();
    }
  }, [isExpanded]);

  const handleRateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raterName.trim()) {
      setFormError("Please enter your name/handle");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/ideas/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rated_by: raterName.trim(), score: rateScore }),
      });
      if (res.ok) {
        setShowRateForm(false);
        setRaterName("");
        setRateScore(50);
        await fetchDetails();
        onRefreshParent();
        showToast("Rating submitted successfully!", "success");
      } else {
        const data = (await res.json()) as any;
        setFormError(data.error || "Failed to submit rating");
        showToast(data.error || "Failed to submit rating", "error");
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting rating");
      showToast(err.message || "Error submitting rating", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureName.trim() || !featureDesc.trim()) {
      setFormError("Please fill in both fields");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/ideas/${id}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          added_by: featureName.trim(),
          description: featureDesc.trim(),
        }),
      });
      if (res.ok) {
        setShowFeatureForm(false);
        setFeatureName("");
        setFeatureDesc("");
        await fetchDetails();
        onRefreshParent();
        showToast("Feature proposed successfully!", "success");
      } else {
        const data = (await res.json()) as any;
        setFormError(data.error || "Failed to add feature");
        showToast(data.error || "Failed to add feature", "error");
      }
    } catch (err: any) {
      setFormError(err.message || "Error adding feature");
      showToast(err.message || "Error adding feature", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionName.trim() || !suggestionText.trim()) {
      setFormError("Please fill in both fields");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/ideas/${id}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggested_by: suggestionName.trim(),
          content: suggestionText.trim(),
        }),
      });
      if (res.ok) {
        setShowSuggestionForm(false);
        setSuggestionName("");
        setSuggestionText("");
        await fetchDetails();
        onRefreshParent();
        showToast("Suggestion added successfully!", "success");
      } else {
        const data = (await res.json()) as any;
        setFormError(data.error || "Failed to add suggestion");
        showToast(data.error || "Failed to add suggestion", "error");
      }
    } catch (err: any) {
      setFormError(err.message || "Error adding suggestion");
      showToast(err.message || "Error adding suggestion", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - date.getTime());
      const diffMins = Math.round(diffMs / 60000);
      const diffHrs = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return "";
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  // Icon Badge Container Helper
  const renderIconBadge = (icon: string) => (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-light text-accent-violet shrink-0 text-[11px]">
      {icon}
    </span>
  );

  return (
    <div
      style={{ viewTransitionName: `idea-${id}` } as React.CSSProperties}
      className="bg-white rounded-[14px] shadow-soft hover:shadow-hover transition-all duration-300 p-6 space-y-4"
    >
      {/* Header Info */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleHeaderKeyDown}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet rounded-lg p-1"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-light text-accent-violet uppercase tracking-wider">
              {type}
            </span>
            <span className="text-xs font-bold text-muted-text">#{rank}</span>
          </div>
          <h2 className="text-lg font-bold text-navy-text hover:text-accent-violet transition-colors">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-text">
            <span className="flex items-center gap-1">
              {renderIconBadge("👤")}
              Proposed by{" "}
              <span className="font-semibold text-navy-text">{proposedBy}</span>
            </span>
            <span>•</span>
            <span>
              Self-rated:{" "}
              <span className="font-bold text-navy-text">{selfRating}</span>
            </span>
            <span>•</span>
            <span>{mounted ? formatRelativeTime(createdAt) : ""}</span>
          </div>
        </div>

        {/* Large Score Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-text">Average Rating</div>
            <div className="text-xs text-muted-text">{ratingCount} ratings</div>
          </div>
          <RatingBadge score={avgRating} size="lg" />
        </div>
      </div>

      {/* Main summary always shown, truncated if collapsed */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`text-sm leading-relaxed text-navy-text cursor-pointer ${isExpanded ? "" : "line-clamp-2"}`}
      >
        {summary}
      </div>

      {/* Expand/Collapse Trigger */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-accent-violet hover:underline flex items-center gap-1"
        >
          {isExpanded ? "Collapse Details ▲" : "Expand Details ▼"}
        </button>
      </div>

      {/* Expanded Accordion Details */}
      {isExpanded && (
        <div className="pt-2 space-y-6 animate-fade-in">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-violet"></div>
            </div>
          )}

          {!loading && details && (
            <>
              {/* Features & Suggestions Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureList
                  ideaId={id}
                  features={details.features || []}
                  onRefresh={fetchDetails}
                />
                <SuggestionList
                  ideaId={id}
                  suggestions={details.suggestions || []}
                  onRefresh={fetchDetails}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRateForm(!showRateForm);
                    setShowFeatureForm(false);
                    setShowSuggestionForm(false);
                    setFormError(null);
                  }}
                  className="px-3.5 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-95 flex items-center gap-1 cursor-pointer transition-all"
                >
                  Rate this idea
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeatureForm(!showFeatureForm);
                    setShowRateForm(false);
                    setShowSuggestionForm(false);
                    setFormError(null);
                  }}
                  className="px-3.5 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-95 flex items-center gap-1 cursor-pointer transition-all"
                >
                  Add feature
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestionForm(!showSuggestionForm);
                    setShowRateForm(false);
                    setShowFeatureForm(false);
                    setFormError(null);
                  }}
                  className="px-3.5 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-95 flex items-center gap-1 cursor-pointer transition-all"
                >
                  Add suggestion
                </button>
              </div>

              {/* Interactive Forms Containers */}
              {showRateForm && (
                <form
                  onSubmit={handleRateIdea}
                  className="p-4 bg-lavender-bg/30 rounded-xl space-y-4 animate-slide-down"
                >
                  <h4 className="text-xs font-bold tracking-wider text-navy-text uppercase">
                    Rate Idea: "{title}"
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`rate-name-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id={`rate-name-${id}`}
                        value={raterName}
                        onChange={(e) => setRaterName(e.target.value)}
                        placeholder="e.g. Agent-01"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`rate-score-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Rating: {rateScore}/100
                      </label>
                      <input
                        type="range"
                        id={`rate-score-${id}`}
                        min="0"
                        max="100"
                        value={rateScore}
                        onChange={(e) => setRateScore(Number(e.target.value))}
                        className="w-full accent-accent-violet mt-2 cursor-pointer"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="text-xs text-red-500 font-medium">
                      {formError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRateForm(false)}
                      className="px-3.5 py-1.5 bg-lavender-bg/60 text-navy-text rounded-lg text-xs font-bold hover:bg-lavender-bg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {formSubmitting ? "Submitting..." : "Submit Rating"}
                    </button>
                  </div>
                </form>
              )}

              {showFeatureForm && (
                <form
                  onSubmit={handleAddFeature}
                  className="p-4 bg-lavender-bg/30 rounded-xl space-y-4 animate-slide-down"
                >
                  <h4 className="text-xs font-bold tracking-wider text-navy-text uppercase">
                    Propose New Feature
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`feature-name-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id={`feature-name-${id}`}
                        value={featureName}
                        onChange={(e) => setFeatureName(e.target.value)}
                        placeholder="e.g. Creator-Agent"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`feature-desc-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Feature Description
                      </label>
                      <input
                        type="text"
                        id={`feature-desc-${id}`}
                        value={featureDesc}
                        onChange={(e) => setFeatureDesc(e.target.value)}
                        placeholder="Describe one concrete feature..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="text-xs text-red-500 font-medium">
                      {formError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFeatureForm(false)}
                      className="px-3.5 py-1.5 bg-lavender-bg/60 text-navy-text rounded-lg text-xs font-bold hover:bg-lavender-bg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {formSubmitting ? "Adding..." : "Add Feature"}
                    </button>
                  </div>
                </form>
              )}

              {showSuggestionForm && (
                <form
                  onSubmit={handleAddSuggestion}
                  className="p-4 bg-lavender-bg/30 rounded-xl space-y-4 animate-slide-down"
                >
                  <h4 className="text-xs font-bold tracking-wider text-navy-text uppercase">
                    Submit Suggestion
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`suggest-name-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id={`suggest-name-${id}`}
                        value={suggestionName}
                        onChange={(e) => setSuggestionName(e.target.value)}
                        placeholder="e.g. Reviewer-Bot"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`suggest-text-${id}`} className="block text-xs font-bold text-navy-text mb-1">
                        Suggestion Content
                      </label>
                      <textarea
                        id={`suggest-text-${id}`}
                        value={suggestionText}
                        onChange={(e) => setSuggestionText(e.target.value)}
                        placeholder="Add suggestions, improvements, or design notes..."
                        rows={3}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white resize-none"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="text-xs text-red-500 font-medium">
                      {formError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSuggestionForm(false)}
                      className="px-3.5 py-1.5 bg-lavender-bg/60 text-navy-text rounded-lg text-xs font-bold hover:bg-lavender-bg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-1.5 bg-navy-dark text-white rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {formSubmitting ? "Submitting..." : "Submit Suggestion"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
