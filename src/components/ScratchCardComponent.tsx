import React, { useState, useRef, useEffect } from 'react';
import { ScratchCard } from '../types';
import { Sparkles, Gift, Clock, Coins, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';

interface ScratchCardComponentProps {
  card: ScratchCard;
  onClaim: (cardId: string, coinsEarned: number) => Promise<void> | void;
}

export const ScratchCardComponent: React.FC<ScratchCardComponentProps> = ({ card, onClaim }) => {
  const [isScratched, setIsScratched] = useState(card.isScratched);
  const [isClaiming, setIsClaiming] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(card.isScratched ? 100 : 0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const now = Date.now();
  const isExpired = !card.isScratched && now > card.expiresAt;
  const remainingDays = Math.max(0, Math.ceil((card.expiresAt - now) / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    if (card.isScratched) {
      setIsScratched(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw silver/gold scratchable overlay
    const width = canvas.width;
    const height = canvas.height;

    // Gradient metallic background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.3, '#E2E8F0');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(0.7, '#E2E8F0');
    grad.addColorStop(1, '#64748B');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative pattern & text
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH HERE ✨', width / 2, height / 2 - 10);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Rub with finger or mouse', width / 2, height / 2 + 15);
  }, [card.isScratched]);

  const handleScratch = (clientX: number, clientY: number) => {
    if (isScratched || isExpired) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2, false);
    ctx.fill();

    // Check progress periodically
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) transparentCount++;
    }
    const ratio = (transparentCount / (pixels.length / 16)) * 100;
    setScratchProgress(Math.round(ratio));

    if (ratio > 40 && !isScratched) {
      triggerClaim();
    }
  };

  const triggerClaim = async () => {
    if (isScratched || isClaiming) return;
    setIsClaiming(true);
    setIsScratched(true);
    try {
      await onClaim(card.id, card.coinsAmount);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isExpired) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center space-y-1 opacity-70">
        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span>Card Expired</span>
        </div>
        <p className="text-[11px] text-slate-400">
          This 15-day validity reward card was not scratched in time.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-md p-4 flex flex-col justify-between">
      {/* Top Details */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 leading-tight">{card.title}</h4>
            <span className="text-[10px] text-slate-500">Order Reward</span>
          </div>
        </div>

        {/* Validity Tag */}
        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-amber-200 text-amber-900">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{isScratched ? 'Claimed' : `${remainingDays} Days Left`}</span>
        </div>
      </div>

      {/* Main Reward Card Stage */}
      <div className="relative aspect-[16/9] w-full bg-white rounded-xl overflow-hidden shadow-inner border border-amber-200 flex flex-col items-center justify-center p-3 text-center">
        {/* Reward Content (Beneath canvas) */}
        <div className="space-y-1 animate-in zoom-in duration-300">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-950 font-mono flex items-center justify-center gap-1">
            <Coins className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>+{card.coinsAmount} Coins</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700">
            = ₹{(card.coinsAmount / 10).toFixed(1)} Discount Saved to Wallet!
          </p>
        </div>

        {/* Scratchable Canvas Overlay */}
        {!isScratched && (
          <canvas
            ref={canvasRef}
            width={320}
            height={180}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none select-none z-10"
            onMouseDown={(e) => {
              isDrawingRef.current = true;
              handleScratch(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (isDrawingRef.current) handleScratch(e.clientX, e.clientY);
            }}
            onMouseUp={() => {
              isDrawingRef.current = false;
            }}
            onMouseLeave={() => {
              isDrawingRef.current = false;
            }}
            onTouchStart={(e) => {
              isDrawingRef.current = true;
              if (e.touches[0]) handleScratch(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (isDrawingRef.current && e.touches[0]) {
                handleScratch(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={() => {
              isDrawingRef.current = false;
            }}
          />
        )}
      </div>

      {/* Bottom status & Quick Reveal button */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {isScratched ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl w-full justify-center border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Coins Permanently Added to Account</span>
          </div>
        ) : (
          <>
            <span className="text-[11px] text-slate-500 font-medium">
              Scratch or tap button to reveal
            </span>
            <button
              type="button"
              onClick={triggerClaim}
              disabled={isClaiming}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isClaiming ? 'Claiming...' : 'Reveal Now'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
