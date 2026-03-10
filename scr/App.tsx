import React, { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  Key, 
  Calendar, 
  Loader2, 
  ChevronRight, 
  ExternalLink,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { 
  discoverTrends, 
  analyzeKeywords, 
  generateContentPlan,
  type KeywordAnalysis,
  type ContentItem
} from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'searching' | 'analyzing' | 'planning' | 'done'>('idle');
  
  const [trends, setTrends] = useState<{ text: string; sources: { title: string; link: string }[] } | null>(null);
  const [keywords, setKeywords] = useState<KeywordAnalysis[]>([]);
  const [plan, setPlan] = useState<ContentItem[]>([]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;

    setLoading(true);
    try {
      // 1. Discover Trends
      setStep('searching');
      const trendData = await discoverTrends(niche);
      setTrends(trendData);

      // 2. Analyze Keywords
      setStep('analyzing');
      const keywordData = await analyzeKeywords(trendData.text);
      setKeywords(keywordData);

      // 3. Generate Plan
      setStep('planning');
      const planData = await generateContentPlan(niche, keywordData);
      setPlan(planData);

      setStep('done');
    } catch (error) {
      console.error("Error in TrendBot flow:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">TrendBot AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black transition-colors">Dashboard</a>
            <a href="#" className="hover:text-black transition-colors">Lịch sử</a>
            <a href="#" className="hover:text-black transition-colors">Cài đặt</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Biến xu hướng thành <span className="text-emerald-600 italic">nội dung viral.</span>
          </h1>
          <p className="text-xl text-black/60 leading-relaxed mb-8">
            Robot AI tự động quét Google Search, phân tích từ khóa tiềm năng và lên kế hoạch đăng bài chi tiết cho thương hiệu của bạn.
          </p>

          <form onSubmit={handleStart} className="relative group">
            <input
              type="text"
              placeholder="Nhập chủ đề hoặc ngách của bạn (VD: AI Tools, Du lịch Nhật Bản...)"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              disabled={loading}
              className="w-full bg-white border border-black/10 rounded-2xl px-6 py-5 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !niche.trim()}
              className="absolute right-3 top-3 bottom-3 bg-emerald-600 text-white px-8 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Bắt đầu <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Progress Steps */}
        {step !== 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[
              { id: 'searching', label: 'Tìm kiếm xu hướng', icon: Search },
              { id: 'analyzing', label: 'Phân tích từ khóa', icon: Key },
              { id: 'planning', label: 'Lập kế hoạch', icon: Calendar },
              { id: 'done', label: 'Hoàn tất', icon: CheckCircle2 },
            ].map((s, i) => {
              const isActive = step === s.id;
              const isCompleted = ['searching', 'analyzing', 'planning', 'done'].indexOf(step) > i;
              return (
                <div 
                  key={s.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-500 flex items-center gap-3",
                    isActive ? "bg-emerald-50 border-emerald-200 ring-4 ring-emerald-500/5" : 
                    isCompleted ? "bg-white border-emerald-100 opacity-60" : "bg-white border-black/5 opacity-40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isActive ? "bg-emerald-600 text-white" : 
                    isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-black/5 text-black/40"
                  )}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={cn("font-medium", isActive && "text-emerald-900")}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Sections */}
        <div className="space-y-12">
          {/* 1. Trends Display */}
          {trends && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-blue-600 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Xu hướng mới nhất</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                  <div className="prose prose-emerald max-w-none prose-p:leading-relaxed prose-headings:tracking-tight">
                    <ReactMarkdown>{trends.text}</ReactMarkdown>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-black/40">Nguồn tham khảo</h3>
                  {trends.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-white border border-black/5 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {source.title}
                        </span>
                        <ExternalLink className="w-4 h-4 text-black/20 group-hover:text-emerald-500 shrink-0" />
                      </div>
                      <div className="mt-2 text-[10px] text-black/40 truncate">{source.link}</div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 2. Keywords Display */}
          {keywords.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Key className="text-amber-600 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Phân tích từ khóa</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {keywords.map((kw, idx) => (
                  <div key={idx} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-lg text-emerald-600">#{kw.keyword}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        kw.competition === 'Low' ? "bg-emerald-100 text-emerald-700" :
                        kw.competition === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {kw.competition}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-black/40">Độ liên quan</span>
                        <span className="font-medium">{kw.relevance}%</span>
                      </div>
                      <div className="w-full bg-black/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${kw.relevance}%` }} />
                      </div>
                      <div className="text-xs text-black/60 pt-1">
                        Ý định: <span className="font-medium text-black">{kw.intent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Content Plan Display */}
          {plan.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Calendar className="text-emerald-600 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Kế hoạch nội dung 7 ngày</h2>
              </div>
              <div className="space-y-4">
                {plan.map((item, idx) => (
                  <div key={idx} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8">
                    <div className="md:w-32 shrink-0">
                      <div className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-1">{item.day}</div>
                      <div className="text-2xl font-black text-black/10">0{idx + 1}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                          {item.platform}
                        </span>
                        <h3 className="text-xl font-bold">{item.title}</h3>
                      </div>
                      <p className="text-black/60 leading-relaxed mb-4">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="self-center md:self-start w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 text-center">
        <p className="text-sm text-black/40">
          © 2026 TrendBot AI. Powered by Google Gemini.
        </p>
      </footer>
    </div>
  );
}

