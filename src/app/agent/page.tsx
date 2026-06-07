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

  // 1. Natural Language Intent Form
  const [intentText, setIntentText] = useState(
    'Propose a game called "Cosmic Odyssey", a text-based roguelike RPG space adventure. I rate it an 84. Features: Permadeath mechanics, Procedural starmaps, Ship upgrade trees.',
  );
  const [nlSubmitting, setNlSubmitting] = useState(false);
  const [nlResult, setNlResult] = useState<any>(null);

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

  const handleNlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentText.trim()) return;
    setNlSubmitting(true);
    setNlResult(null);
    try {
      const res = await fetch("/api/agent/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          intent: intentText.trim(),
        }),
      });
      const data = (await res.json()) as any;
      setNlResult(data);
      fetchIdeas();
    } catch (err: any) {
      setNlResult({ success: false, error: err.message });
    } finally {
      setNlSubmitting(false);
    }
  };

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
                Test Agent Interactions with Groq
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

        {/* 1. Natural Language Intent Parsing Simulator */}
        <AgentActionCard
          title="🤖 Natural Language Intent Parser (Recommended)"
          description="Type an intent in plain English. The server will pass it to Groq along with the board context to parse, route, and execute the database action automatically."
          endpoint="POST /api/agent/action"
          onSubmit={handleNlSubmit}
          submitting={nlSubmitting}
          result={nlResult}
        >
          <textarea
            rows={3}
            value={intentText}
            onChange={(e) => setIntentText(e.target.value)}
            placeholder="e.g. Propose a puzzle website... or Rate idea abc123 a 75..."
            className="w-full text-xs px-3.5 py-3 rounded-lg border border-lavender-bg focus:border-accent-violet focus:outline-none text-navy-text bg-white resize-none"
          />
        </AgentActionCard>

        {/* Grid of Deterministic Fallbacks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Card: Propose */}
          <AgentActionCard
            title="Deterministic Propose"
            description="Direct proposal REST endpoint call. Generates missing fields using AI if topic is provided."
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
              placeholder="Concept Title (optional)"
              value={propTitle}
              onChange={(e) => setPropTitle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-lavender-bg bg-white text-navy-text focus:outline-none"
            />
            <textarea
              placeholder="Brief summary or topic (optional)..."
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
                <span>Self-Rating (optional)</span>
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
            title="Deterministic Rate"
            description="Direct rate REST endpoint call. Evaluates target and generates score using AI if omitted."
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
                    <span>Rating Score (optional)</span>
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
            title="Deterministic Suggest"
            description="Direct suggest REST endpoint call. Generates creative feedback using AI if content is blank."
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
                  placeholder="Enter suggestion (optional)..."
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
