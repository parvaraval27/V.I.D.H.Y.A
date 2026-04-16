import { useState, useEffect, useRef } from 'react';
import { Code2, ExternalLink, TrendingUp, Tag, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const embedUrl = 'https://codeforces-metric.vercel.app/';

const overviewSection = {
  title: 'Codeforces Metric',
  description:
    'A client-side Codeforces profile analyzer that provides rating breakdowns, tag insights, productivity timing, language stats, contest source categorization, friend comparisons and goal-based DSA tracking - all built with plain JS and Codeforces public APIs.'
};

const features = [
  {
    icon: TrendingUp,
    color: '#7c3aed',
    bg: '#ede9fe',
    title: 'See Momentum Clearly',
    desc: 'Track rating swings and solve consistency patterns so you can improve with intent.',
    rot: '-1deg',
  },
  {
    icon: Tag,
    color: '#1d4ed8',
    bg: '#dbeafe',
    title: 'Target Weak Tags',
    desc: 'Break performance down by topic to double down on strengths and fix weak areas faster.',
    rot: '0.5deg',
  },
  {
    icon: Clock,
    color: '#15803d',
    bg: '#dcfce7',
    title: 'Code at Peak Hours',
    desc: 'Discover when your focus is strongest and schedule high-value practice in that window.',
    rot: '-0.5deg',
  },
  {
    icon: Users,
    color: '#b45309',
    bg: '#fef3c7',
    title: 'Benchmark With Friends',
    desc: 'Compare trends with peers and use friendly pressure to stay consistent week after week.',
    rot: '1deg',
  },
];

function DsaHelperPage() {
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeTimerRef = useRef<number | null>(null);

  const [showTransition, setShowTransition] = useState(true);
  const [transitionVisible, setTransitionVisible] = useState(false);

  useEffect(() => {
    setTransitionVisible(true);
    const fadeOut = window.setTimeout(() => setTransitionVisible(false), 1000);
    const finish = window.setTimeout(() => setShowTransition(false), 1400);
    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(finish);
    };
  }, []);

  useEffect(() => {
    if (isEmbedOpen) {
      setIframeError(false);
      setIframeLoading(true);
      iframeTimerRef.current = window.setTimeout(() => {
        setIframeLoading(false);
        setIframeError(true);
      }, 8000) as unknown as number;
    } else {
      if (iframeTimerRef.current) {
        window.clearTimeout(iframeTimerRef.current);
        iframeTimerRef.current = null;
      }
      setIframeLoading(false);
      setIframeError(false);
    }
  }, [isEmbedOpen]);

  const openEmbed = () => setIsEmbedOpen(true);

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
    if (iframeTimerRef.current) {
      window.clearTimeout(iframeTimerRef.current);
      iframeTimerRef.current = null;
    }
  };

  const handleModalClose = () => {
    setIsEmbedOpen(false);
    setIframeLoading(false);
    setIframeError(false);
    if (iframeTimerRef.current) {
      window.clearTimeout(iframeTimerRef.current);
      iframeTimerRef.current = null;
    }
  };

  return (
    <>
      {/* ── Page shell: same notebook-paper background as all other pages ── */}
      <div className="min-h-screen relative overflow-x-hidden"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: `
            linear-gradient(#dfe7ff 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,0,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '100% 28px, 40px 100%',
        }}
      >

        {/* ── Spiral binding rings (left edge) ── */}
        <div className="absolute left-0 top-0 bottom-0 w-8 hidden lg:flex flex-col items-center justify-around py-12 z-30 pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="block w-4 h-4 rounded-full border-2 border-gray-400 bg-gradient-to-br from-gray-200 to-gray-400 shadow-sm"
            />
          ))}
        </div>

        {/* ── Red margin line ── */}
        <div
          className="absolute top-0 bottom-0 hidden lg:block z-20 pointer-events-none"
          style={{ left: '52px', width: '3px', background: 'rgba(220, 50, 50, 0.85)', borderRadius: '2px' }}
        />

        {/* ── Bookmark tab (top right) ── */}
        <div
          className="absolute top-0 right-16 w-12 h-20 z-30 hidden md:block"
          style={{
            background: 'linear-gradient(180deg, #7c3aed, #6d28d9)',
            clipPath: 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)',
            boxShadow: '-2px 4px 12px rgba(109,40,217,0.35)',
          }}
        >
          <span className="text-white text-[9px] font-hand tracking-widest rotate-180 block text-center mt-2" style={{ writingMode: 'vertical-rl' }}>DSA</span>
        </div>

        {/* ── Dog-ear (top right corner) ── */}
        <div className="absolute top-0 right-0 w-16 h-16 z-20 hidden md:block pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full"
            style={{ background: 'linear-gradient(225deg, #e5e7eb 45%, transparent 45%)' }} />
          <div className="absolute top-0 right-0 w-full h-full"
            style={{ background: 'linear-gradient(225deg, transparent 45%, #f3f0ff 45%)' }} />
        </div>

        {/* ── Main notebook content area ── */}
        <div className="relative pl-4 lg:pl-20 pr-4 lg:pr-16 pt-10 pb-16 max-w-[1200px] mx-auto">

          {/* Page header (handwritten style) */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="font-hand text-3xl sm:text-4xl text-purple-900 mt-0.5 leading-tight">
                Codeforces Metric
                {/* Highlighter underline */}
                <span
                  className="block h-3 -mt-3 opacity-40 rounded"
                  style={{ background: '#fde047', maxWidth: '14rem' }}
                />
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="font-hand text-purple-600 hover:bg-purple-50 border border-dashed border-purple-300 mt-1"
            >
              ← Back
            </Button>
          </div>

          {/* Horizontal rule (like a notebook rule) */}
          <div className="border-b-2 border-dashed border-purple-200 mb-6 mt-2" />

          {/* ── Description block — left-margin note style ── */}
          <div
            className="relative mb-6 pl-5 pr-4 py-4 rounded-r-xl"
            style={{
              borderLeft: '5px solid #7c3aed',
              background: 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(255,255,255,0.9))',
              boxShadow: '2px 4px 14px rgba(124,58,237,0.07)',
            }}
          >
            {/* tiny pencil mark */}
            <span className="font-hand text-[10px] text-purple-400 absolute -top-2.5 left-4 bg-white px-1">description</span>
            <p className="font-hand text-base sm:text-lg text-gray-800 leading-relaxed">
              {overviewSection.description}
            </p>
          </div>

          {/* ── Quick Actions — notebook sticky-style ── */}
          <div
            className="relative mb-7 p-5 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(250,246,236,0.95))',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 4px 18px rgba(16,24,40,0.06), 2px 2px 0 rgba(124,58,237,0.08)',
            }}
          >
            {/* corner fold */}
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
              style={{ background: 'linear-gradient(225deg, #ddd6fe 45%, transparent 45%)' }} />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="font-hand text-[11px] uppercase tracking-[0.2em] text-purple-400 mb-0.5">Quick Actions</p>
                <h3 className="font-hand text-xl text-purple-900">Start Your DSA Session</h3>
                <p className="font-hand text-sm text-gray-500 mt-0.5">Open the analyzer inline or run it in a separate tab.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  onClick={openEmbed}
                  className="min-w-[175px] justify-center font-hand text-base"
                  style={{ fontFamily: 'var(--font-hand)' }}
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Launch Here
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open(embedUrl, '_blank')}
                  className="min-w-[175px] justify-center font-hand text-base border-purple-300 text-purple-700 bg-white hover:bg-purple-50"
                  style={{ fontFamily: 'var(--font-hand)' }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>

          {/* ── Feature cards — notebook note cards ── */}
          <p className="font-hand text-xs text-purple-400 tracking-widest uppercase mb-3">What you get ↓</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="relative p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group"
                  style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(250,248,242,0.98))',
                    border: '1.5px solid rgba(0,0,0,0.065)',
                    boxShadow: '0 6px 20px rgba(16,24,40,0.06), 1px 1px 0 rgba(0,0,0,0.03)',
                    transform: `rotate(${f.rot})`,
                  }}
                >
                  {/* lined paper hint inside card */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-30 pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(#dfe7ff 1px, transparent 1px)',
                      backgroundSize: '100% 22px',
                      backgroundPosition: '0 28px',
                    }}
                  />
                  {/* left mini-margin */}
                  <div
                    className="absolute left-8 top-0 bottom-0 w-px pointer-events-none"
                    style={{ background: 'rgba(220,50,50,0.2)' }}
                  />
                  <div className="relative flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      style={{ background: f.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <h3 className="font-hand text-lg leading-tight mb-1" style={{ color: f.color }}>{f.title}</h3>
                      <p className="font-hand text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Sticky note tips (bottom) ── */}
          <div className="hidden lg:flex gap-5 justify-between">
            <div
              className="p-5 max-w-[220px] rounded-sm shadow-xl"
              style={{
                background: 'linear-gradient(170deg, #fef9c3, #fde68a)',
                transform: 'rotate(2deg)',
                borderBottom: '4px solid #ca8a04',
                boxShadow: '3px 6px 18px rgba(0,0,0,0.18)',
              }}
            >
              <p className="font-hand text-sm text-amber-900 font-bold mb-1">Quick Tip</p>
              <p className="font-hand text-xs text-amber-800 leading-relaxed">Focus on problem quality over quantity. Dont spam 800s like me :-(</p>
            </div>
            <div
              className="p-5 max-w-[220px] rounded-sm shadow-xl"
              style={{
                background: 'linear-gradient(170deg, #dcfce7, #bbf7d0)',
                transform: 'rotate(-1.5deg)',
                borderBottom: '4px solid #16a34a',
                boxShadow: '3px 6px 18px rgba(0,0,0,0.18)',
              }}
            >
              <p className="font-hand text-sm text-green-900 font-bold mb-1">Study Hack</p>
              <p className="font-hand text-xs text-green-800 leading-relaxed">Review your solutions after 24 hours. Upsolve contests for improving in the next one!</p>
            </div>
          </div>

          {/* ── Page footer ── */}
          <div className="mt-10 pt-3 border-t-2 border-dashed border-purple-200 flex justify-between items-center">
            <span className="font-hand text-xs text-gray-400">V.I.D.H.Y.A · Codeforces Module</span>
            <span className="font-hand text-xs text-gray-400">Page 1</span>
          </div>

        </div>{/* /main content */}
      </div>{/* /page shell */}

      {/* ── Module transition overlay ── */}
      {showTransition && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-500 ${transitionVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="text-6xl font-hand text-purple-800 tracking-wide">Module 1</div>
        </div>
      )}

      {/* ── Embed dialog ── */}
      <Dialog open={isEmbedOpen} onOpenChange={(open) => { if (!open) handleModalClose(); else setIsEmbedOpen(true); }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-7xl h-[88vh] p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div
              className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-purple-200"
              style={{
                background: 'linear-gradient(90deg, rgba(237,233,254,0.9), rgba(255,255,255,0.9))',
                backgroundImage: 'linear-gradient(#dfe7ff 1px, transparent 1px)',
                backgroundSize: '100% 28px',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Code2 className="w-5 h-5 text-purple-700" />
                <h3 className="font-hand text-base sm:text-xl text-purple-800 truncate">DSA Helper · Codeforces Metrics</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => window.open(embedUrl, '_blank')} className="font-hand text-purple-600 hover:bg-purple-50 border border-dashed border-purple-300">
                  <ExternalLink className="w-4 h-4 mr-1" /> New tab
                </Button>
                <Button variant="ghost" size="sm" onClick={handleModalClose} className="font-hand text-gray-500 hover:bg-gray-100">
                  Close
                </Button>
              </div>
            </div>

            <div className="flex-1 relative" style={{ background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)' }}>
              {iframeLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                </div>
              )}
              {iframeError && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 p-6 text-center">
                  <p className="font-hand text-lg text-slate-700 mb-3">Embedding blocked or taking too long.</p>
                  <div className="flex gap-3">
                    <Button className="font-hand" onClick={() => window.open(embedUrl, '_blank')}>Open in new tab</Button>
                    <Button className="font-hand" variant="outline" onClick={() => {
                      setIframeError(false);
                      setIframeLoading(true);
                      iframeTimerRef.current = window.setTimeout(() => {
                        setIframeLoading(false); setIframeError(true);
                      }, 8000) as unknown as number;
                    }}>Retry</Button>
                  </div>
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title="DSA Helper - Codeforces Metrics"
                onLoad={handleIframeLoad}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DsaHelperPage;
