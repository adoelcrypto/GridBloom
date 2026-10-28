/**
 * GridBloom - How to Play & Bloom Pulse Tutorial Dialog
 * Step-by-step visual tutorial covering placement, line clears, combos, and Bloom Pulse.
 */

import React, { useState } from 'react';
import { Sparkles, Grid, Zap, Layers, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';

interface TutorialModalProps {
  onComplete: () => void;
  onClose: () => void;
}

const STEPS = [
  {
    title: '1. Place Polyominoes',
    subtitle: 'Drag and drop pieces from the tray onto the 8x8 grid.',
    icon: Grid,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description:
      'Pieces can be placed in any order. The tray refills with 3 fresh shapes once all three current pieces have been used. Pieces do not fall with gravity.',
  },
  {
    title: '2. Clear Full Lines',
    subtitle: 'Fill entire horizontal rows or vertical columns.',
    icon: Layers,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description:
      'Completed lines clear simultaneously! Clearing multiple rows and columns in a single turn awards massive multiline bonus points.',
  },
  {
    title: '3. Chain Combo Streaks',
    subtitle: 'Clear lines on consecutive turns for multiplying points.',
    icon: Sparkles,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description:
      'Consecutive turns that clear lines increase your Combo counter (x2, x3, x4...). Each combo level adds escalating bonus points to every clear!',
  },
  {
    title: '4. Unleash Bloom Pulse',
    subtitle: 'Our signature clearing ability when the board gets tight.',
    icon: Zap,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    description:
      'Every cleared line charges your Pulse Energy meter (+20% per line + combo bonus). At 100%, tap "USE PULSE" and pick any row or column to vaporize it instantly!',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Skip tutorial"
        >
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Visual icon box */}
        <div
          className={`w-16 h-16 mx-auto rounded-2xl bg-slate-900 border ${step.borderColor} flex items-center justify-center mb-4 shadow-inner`}
        >
          <Icon size={32} className={step.color} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-black text-white text-center mb-1">{step.title}</h3>
        <p className={`text-xs font-semibold text-center mb-3 ${step.color}`}>{step.subtitle}</p>
        <p className="text-xs text-slate-300 text-center leading-relaxed mb-6 px-2">{step.description}</p>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-2">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 px-3 cursor-pointer"
            >
              Skip
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-1 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-md transition active:scale-98 cursor-pointer ml-auto"
          >
            <span>{isLast ? 'Got it!' : 'Next'}</span>
            {isLast ? <Check size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
