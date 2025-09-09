import React, { useState, useEffect, useRef } from "react";
import { MapPin, Brain, Clock, Heart } from "lucide-react";
import type { City } from "@/lib/weather";

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: City;
  onAnswerSubmit: (isCorrect: boolean, reasoning: string) => void;
  timeRemaining: number;
  health: number;
}

// Sample trivia questions for different cities
const TRIVIA_QUESTIONS: Record<string, string> = {
  Paris: "What famous iron tower can you see from the sky?",
  London: "What iconic clock tower is visible from above?",
  Rome: "What ancient amphitheater stands out in this city?",
  Berlin: "What famous gate is a landmark in this city?",
  Madrid: "What royal palace dominates the skyline?",
  Vienna: "What grand opera house is a cultural symbol?",
  Prague: "What medieval castle overlooks the city?",
  Budapest: "What famous parliament building sits by the river?",
  Amsterdam: "What distinctive canal system defines this city?",
  Brussels: "What famous square is the heart of this city?",
};

const TRIVIA_TIME_MS = 20000; // 20 seconds for answering

export function TriviaModal({
  isOpen,
  onClose: _onClose,
  currentCity,
  onAnswerSubmit,
  timeRemaining: _timeRemaining,
  health,
}: TriviaModalProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localTime, setLocalTime] = useState(TRIVIA_TIME_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);

  // Reset timer and form when modal opens or city changes
  useEffect(() => {
    if (isOpen) {
      // Play trivia open sound
      if ((window as any).playGameSound) {
        (window as any).playGameSound('trivia-open');
      }
      
      setUserAnswer("");
      setReasoning("");
      setIsSubmitting(false);
      setLocalTime(TRIVIA_TIME_MS);
      hasSubmittedRef.current = false;
    }
  }, [isOpen, currentCity.name]);

  // Timer countdown effect
  useEffect(() => {
    if (!isOpen) return;
    if (isSubmitting) return;
    if (hasSubmittedRef.current) return;

    timerRef.current = setInterval(() => {
      setLocalTime((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current!);
          // If not submitted, auto-fail
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            setIsSubmitting(true);
            setTimeout(() => {
              onAnswerSubmit(false, "No answer submitted in time.");
              setIsSubmitting(false);
            }, 500);
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting, currentCity.name]);

  const question =
    TRIVIA_QUESTIONS[currentCity.name] ||
    `What city are you currently flying over? Look for distinctive landmarks, architecture, or geographical features.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !reasoning.trim()) return;

    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    // Simple answer validation - check if the city name is mentioned
    const isCorrect =
      userAnswer.toLowerCase().includes(currentCity.name.toLowerCase()) ||
      currentCity.name.toLowerCase().includes(userAnswer.toLowerCase());

    // Play appropriate sound effect
    if ((window as any).playGameSound) {
      (window as any).playGameSound(isCorrect ? 'trivia-correct' : 'trivia-incorrect');
    }

    // Add a small delay for better UX
    setTimeout(() => {
      onAnswerSubmit(isCorrect, reasoning);
      setUserAnswer("");
      setReasoning("");
      setIsSubmitting(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-xl w-full max-w-4xl h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-700 shadow-2xl flex flex-col overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>
          {`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Flying Trivia
              </h2>
              <p className="text-slate-400 text-xs">
                Test your world knowledge! Correct answers restore health, wrong answers reduce it.
              </p>
            </div>
          </div>
          {/* <button
            onClick={() => {
              // Play map close sound
              if ((window as any).playGameSound) {
                (window as any).playGameSound('map-close');
              }
              onClose();
            }}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-slate-400 hover:text-white" />
          </button> */}
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-slate-300">Time Remaining</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">
              {Math.max(0, Math.ceil(localTime / 1000))}s
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs text-slate-300">Current Health</span>
            </div>
            <div className="text-lg font-bold text-red-400">
              {Math.round(health)}%
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-6 flex-shrink-0">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            Identify Your Location
          </h3>
          <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-600">
            <p className="text-base text-slate-200 mb-4">{question}</p>
            <div className="text-xs text-slate-400">
              <p className="mb-1">Look for:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>Distinctive buildings or monuments</li>
                <li>Geographical features (rivers, mountains)</li>
                <li>City layout and architecture style</li>
                <li>Famous landmarks visible from above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Answer Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex-1 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="cityAnswer"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                What city do you think you're flying over?
              </label>
              <input
                type="text"
                id="cityAnswer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter the city name..."
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="reasoning"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                Why do you think it's this city? (landmarks, features, etc.)
              </label>
              <textarea
                id="reasoning"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Describe what you see that makes you think this is the city..."
                rows={4}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-sm flex-1"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!userAnswer.trim() || !reasoning.trim() || isSubmitting}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 text-sm mt-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        </form>
      </div>
      <style>
        {`
          .bg-gradient-to-br::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}
