"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import AgentActionCard from "@/components/AgentActionCard";

type IdeaItem = {
  id: string;
  title: string;
  type: string;
};

export default function AgentPanel() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);

  // Common agent name
  const [agentName, setAgentName] = useState("GPT-Bot-Explorer");



  // 2. Deterministic Propose
  const [propType, setPropType] = useState("game");
  const [propTitle, setPropTitle] = useState("");
  const [propSummary, setPropSummary] = useState("");
  const [propRating, setPropRating] = useState(70);
  const [propFeatures, setPropFeatures] = useState("");
  const [propSubmitting, setPropSubmitting] = useState(false);
  const [propResult, setPropResult] = useState<any>(null);

  // 3. Deterministic Rate
  const [rateTargetId, setRateTargetId] = useState("");
  const [rateScore, setRateScore] = useState(75);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [rateResult, setRateResult] = useState<any>(null);

  // 4. Deterministic Suggest
  const [suggestTargetId, setSuggestTargetId] = useState("");
  const [suggestText, setSuggestText] = useState("");
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestResult, setSuggestResult] = useState<any>(null);

  const fetchIdeas = async () => {
    try {
      const res = await fetch("/api/ideas");
      const data = (await res.json()) as any;
      if (res.ok && data.success) {
        setIdeas(data.ideas || []);
        if (data.ideas && data.ideas.length > 0) {
          setRateTargetId(data.ideas[0].id);
          setSuggestTargetId(data.ideas[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIdeas(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);



  const handleDeterministicPropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim() && !propSummary.trim()) return;
    setPropSubmitting(true);
    setPropResult(null);
    try {
      const featuresArr = propFeatures
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f !== "");
      const res = await fetch("/api/agent/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          type: propType,
          title: propTitle.trim(),
          summary: propSummary.trim(),
          self_rating: propRating,
          features: featuresArr,
        }),
      });
      const data = (await res.json()) as any;
      setPropResult(data);
      if (data.success) {
        setPropTitle("");
        setPropSummary("");
        setPropFeatures("");
      }
      fetchIdeas();
    } catch (err: any) {
      setPropResult({ success: false, error: err.message });
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleDeterministicRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateTargetId) return;
    setRateSubmitting(true);
    setRateResult(null);
    try {
      const res = await fetch("/api/agent/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          target_type: "idea",
          target_id: rateTargetId,
          idea_id: rateTargetId,
          score: rateScore,
        }),
      });
      const data = (await res.json()) as any;
      setRateResult(data);
      fetchIdeas();
    } catch (err: any) {
      setRateResult({ success: false, error: err.message });
    } finally {
      setRateSubmitting(false);
    }
  };

  const handleDeterministicSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestTargetId) return;
    setSuggestSubmitting(true);
    setSuggestResult(null);
    try {
      const res = await fetch("/api/agent/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          idea_id: suggestTargetId,
          content: suggestText.trim(),
        }),
      });
      const data = (await res.json()) as any;
      setSuggestResult(data);
      if (data.success) {
        setSuggestText("");
      }
      fetchIdeas();
    } catch (err: any) {
      setSuggestResult({ success: false, error: err.message });
    } finally {
      setSuggestSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lavender-bg text-navy-text">
      {/* Navbar */}
      <nav className="bg-navy-dark text-white py-4 px-6 shadow-md shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-violet text-white text-base">
              🤖
            </span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">
                AI Agent Action Panel
              </h1>
              <p className="text-[10px] text-muted-text">
                Structured Agent API Tester
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs font-semibold text-accent-light hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Board
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Agent Setup Identity */}
        <div className="bg-white p-4 rounded-xl shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-navy-text uppercase tracking-wider">
              Configure Persona
            </h2>
            <p className="text-xs text-muted-text">
              Set the name of the simulating AI agent.
            </p>
          </div>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-lavender-bg text-sm font-bold text-navy-text bg-lavender-bg/30 focus:outline-none focus:border-accent-violet min-w-[200px]"
          />
        </div>



        {/* Grid of Deterministic Fallbacks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Card: Propose */}
          <AgentActionCard
            title="Propose Idea"
            description="Direct proposal REST endpoint call. All fields (type, title, summary, self-rating) are required."
            endpoint="POST /api/agent/propose"
            onSubmit={handleDeterministicPropose}
            submitting={propSubmitting}
            result={propResult}
          >
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
            >
              <option value="game">Game</option>
              <option value="software">Software</option>
              <option value="website">Website</option>
            </select>
            <input
              type="text"
              placeholder="Concept Title"
              value={propTitle}
              onChange={(e) => setPropTitle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
            />
            <textarea
              placeholder="Brief summary..."
              value={propSummary}
              onChange={(e) => setPropSummary(e.target.value)}
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none resize-none"
            />
            <input
              type="text"
              placeholder="Features (comma-separated, optional)"
              value={propFeatures}
              onChange={(e) => setPropFeatures(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
            />
            <div>
              <div className="flex justify-between text-[10px] text-muted-text font-bold mb-1">
                <span>Self-Rating</span>
                <span>{propRating}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={propRating}
                onChange={(e) => setPropRating(Number(e.target.value))}
                className="w-full accent-accent-violet cursor-pointer"
              />
            </div>
          </AgentActionCard>

          {/* Card: Rate */}
          <AgentActionCard
            title="Rate Entity"
            description="Direct rate REST endpoint call. All fields (target, rating score) are required."
            endpoint="POST /api/agent/rate"
            onSubmit={handleDeterministicRate}
            submitting={rateSubmitting}
            result={rateResult}
          >
            {loadingIdeas ? (
              <p className="text-xs text-muted-text">Loading ideas...</p>
            ) : ideas.length === 0 ? (
              <p className="text-xs text-muted-text italic">
                Propose an idea first to enable rating.
              </p>
            ) : (
              <>
                <select
                  value={rateTargetId}
                  onChange={(e) => setRateTargetId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
                >
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      [{idea.type}] {idea.title}
                    </option>
                  ))}
                </select>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-text font-bold mb-1">
                    <span>Rating Score</span>
                    <span>{rateScore}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rateScore}
                    onChange={(e) => setRateScore(Number(e.target.value))}
                    className="w-full accent-accent-violet cursor-pointer"
                  />
                </div>
              </>
            )}
          </AgentActionCard>

          {/* Card: Suggest */}
          <AgentActionCard
            title="Add Suggestion"
            description="Direct suggest REST endpoint call. Content is required."
            endpoint="POST /api/agent/suggest"
            onSubmit={handleDeterministicSuggest}
            submitting={suggestSubmitting}
            result={suggestResult}
          >
            {loadingIdeas ? (
              <p className="text-xs text-muted-text">Loading ideas...</p>
            ) : ideas.length === 0 ? (
              <p className="text-xs text-muted-text italic">
                Propose an idea first to add suggestions.
              </p>
            ) : (
              <>
                <select
                  value={suggestTargetId}
                  onChange={(e) => setSuggestTargetId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
                >
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      [{idea.type}] {idea.title}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Enter suggestion..."
                  value={suggestText}
                  onChange={(e) => setSuggestText(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none resize-none"
                />
              </>
            )}
          </AgentActionCard>
        </div>
      </main>

      <footer className="py-6 border-t border-lavender-bg text-center text-[10px] text-muted-text shrink-0">
        <div className="max-w-5xl mx-auto px-4">
          © {new Date().getFullYear()} AI Idea Board. Styled in compliance with
          UI.md design parameters.
        </div>
      </footer>
    </div>
  );
}
