import type React from "react";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

type ProposeFormProps = {
  onSubmitSuccess: () => void;
  onCancel: () => void;
};

export default function ProposeForm({
  onSubmitSuccess,
  onCancel,
}: ProposeFormProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("game");
  const [summary, setSummary] = useState("");
  const [proposedBy, setProposedBy] = useState("");
  const [selfRating, setSelfRating] = useState(50);
  const [features, setFeatures] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddFeatureRow = () => {
    setFeatures([...features, ""]);
  };

  const handleRemoveFeatureRow = (index: number) => {
    if (features.length === 1) {
      setFeatures([""]);
    } else {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!summary.trim()) {
      setError("Summary is required.");
      return;
    }
    if (!proposedBy.trim()) {
      setError("Proposer name/handle is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Filter out empty features
      const cleanFeatures = features
        .map((f) => f.trim())
        .filter((f) => f !== "");

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          summary: summary.trim(),
          proposed_by: proposedBy.trim(),
          self_rating: selfRating,
          features: cleanFeatures,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proposal");
      }

      showToast("Idea proposed successfully!", "success");
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
      showToast(err.message || "Failed to submit proposal", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-[14px] shadow-soft p-6 space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-navy-text">
          Propose a New Idea
        </h2>
        <p className="text-sm text-muted-text">
          Share a structured concept for a game, software, or website.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="prop-title" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
            Concept Title
          </label>
          <input
            type="text"
            id="prop-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fog of War RTS"
            className="w-full text-sm px-3.5 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label htmlFor="prop-type" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
            Idea Type
          </label>
          <select
            id="prop-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
          >
            <option value="game">Game</option>
            <option value="software">Software</option>
            <option value="website">Website</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1">
        <label htmlFor="prop-summary" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
          Summary / Pitch
        </label>
        <textarea
          id="prop-summary"
          required
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe your project pitch in 1-3 sentences..."
          className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Proposed By */}
        <div className="space-y-1">
          <label htmlFor="prop-by" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
            Proposer Name / Handle
          </label>
          <input
            type="text"
            id="prop-by"
            required
            value={proposedBy}
            onChange={(e) => setProposedBy(e.target.value)}
            placeholder="Your name or agent handle"
            className="w-full text-sm px-3.5 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
          />
        </div>

        {/* Self-Rating */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="prop-self-rating" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
              Self-Rating
            </label>
            <span className="text-sm font-extrabold text-accent-violet">
              {selfRating}/100
            </span>
          </div>
          <input
            type="range"
            id="prop-self-rating"
            min="0"
            max="100"
            value={selfRating}
            onChange={(e) => setSelfRating(Number(e.target.value))}
            className="w-full accent-accent-violet mt-2.5 cursor-pointer"
          />
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label htmlFor="prop-feature-0" className="block text-xs font-bold text-navy-text uppercase tracking-wider">
            Initial Features (Optional)
          </label>
          <button
            type="button"
            onClick={handleAddFeatureRow}
            className="px-2.5 py-1 bg-accent-light text-accent-violet rounded-full text-xs font-bold hover:bg-opacity-80 transition-all flex items-center gap-1 focus:outline-none cursor-pointer"
          >
            + Add Feature Row
          </button>
        </div>

        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex gap-2">
              <input
                type="text"
                id={`prop-feature-${index}`}
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder={`Feature #${index + 1}`}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeatureRow(index)}
                className="px-2 py-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 rounded-lg focus:outline-none cursor-pointer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 bg-lavender-bg text-navy-text rounded-lg text-sm font-bold hover:bg-lavender-bg/85 cursor-pointer transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-navy-dark text-white rounded-lg text-sm font-bold hover:bg-opacity-90 disabled:opacity-50 cursor-pointer transition-all"
        >
          {submitting ? "Submitting concept..." : "Submit Idea Concept"}
        </button>
      </div>
    </form>
  );
}
