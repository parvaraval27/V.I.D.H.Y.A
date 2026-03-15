import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { 
  Code2, 
  FileText, 
  Bot, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  User, 
  ArrowRight,
  Menu,
  X,
  Flame,
  Loader2,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { taskAPI } from "@/lib/taskApi";
import { getReminders, getCodeforcesContests, getLeetCodeContests } from "@/lib/calendarApi";

export default function Home() {
  const [activeSection, setActiveSection] = useState("hero");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Quick Stats State
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedToday: 0,
    maxStreak: 0,
    upcomingEvents: [] as { title: string; date: Date }[],
    loadingTasks: true,
    loadingCalendar: true,
  });

  // Fetch real stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch tasks
        const tasks = await taskAPI.getAllTasks({ archive: false });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let completedToday = 0;
        let maxStreak = 0;
        
        tasks.forEach((task: any) => {
          if (task.summary?.lastCompletedAt) {
            const lastCompleted = new Date(task.summary.lastCompletedAt);
            lastCompleted.setHours(0, 0, 0, 0);
            if (lastCompleted.getTime() === today.getTime()) {
              completedToday++;
            }
          }
          if (task.summary?.currentStreak > maxStreak) {
            maxStreak = task.summary.currentStreak;
          }
        });

        setStats(prev => ({
          ...prev,
          activeTasks: tasks.length,
          completedToday,
          maxStreak,
          loadingTasks: false,
        }));
      } catch (err) {
        console.error('Error fetching task stats:', err);
        setStats(prev => ({ ...prev, loadingTasks: false }));
      }

      try {
        // Fetch calendar events for next 7 days
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const response = await getReminders({ from: now.toISOString(), to: weekLater.toISOString() });
        let allEvents: { title: string; date: Date }[] = [];
        
        // Add reminders
        const occurrences = response.data?.occurrences || [];
        occurrences.forEach((e: any) => {
          allEvents.push({ title: e.title, date: new Date(e.occurrenceDate) });
        });

        // Add Codeforces contests
        try {
          const cf = await getCodeforcesContests();
          if (cf?.status === 'OK') {
            const fromTS = Math.floor(now.getTime() / 1000);
            const toTS = Math.floor(weekLater.getTime() / 1000);
            cf.result.filter((c: any) => c.phase === 'BEFORE' && c.startTimeSeconds >= fromTS && c.startTimeSeconds <= toTS)
              .forEach((c: any) => allEvents.push({ title: c.name, date: new Date(c.startTimeSeconds * 1000) }));
          }
        } catch (e) { /* ignore */ }

        // Add LeetCode contests
        try {
          const lc = await getLeetCodeContests();
          if (lc?.contests) {
            const fromTS = Math.floor(now.getTime() / 1000);
            const toTS = Math.floor(weekLater.getTime() / 1000);
            lc.contests.filter((c: any) => c.startTime >= fromTS && c.startTime <= toTS)
              .forEach((c: any) => allEvents.push({ title: c.title, date: new Date(c.startTime * 1000) }));
          }
        } catch (e) { /* ignore */ }
        
        const upcomingEvents = allEvents
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 3);

        setStats(prev => ({
          ...prev,
          upcomingEvents,
          loadingCalendar: false,
        }));
      } catch (err) {
        console.error('Error fetching calendar stats:', err);
        setStats(prev => ({ ...prev, loadingCalendar: false }));
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const features = [
    {
      id: "dsa",
      title: "DSA Helper",
      icon: <Code2 className="w-5 h-5" />,
      description: "Track problems, analyze difficulty, and get smart learning suggestions.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      id: "resume",
      title: "Resume Builder",
      icon: <FileText className="w-5 h-5" />,
      description: "Create ATS-friendly resumes with version control and easy export.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      id: "ai",
      title: "AI Assistant",
      icon: <Bot className="w-5 h-5" />,
      description: "Chat with documents, summarize notes, and get coding help.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: "tasks",
      title: "Task Manager",
      icon: <CheckSquare className="w-5 h-5" />,
      description: "Smart productivity tracking — build streaks, track daily tasks, recurring reminders, and analytics.",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: <CalendarIcon className="w-5 h-5" />,
      description: "Sync assignments, exams, and contests in one unified view.",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      id: "personal",
      title: "Personal Space",
      icon: <User className="w-5 h-5" />,
      description: "Your profile, academic info, career goals, coding profiles, skills, and productivity stats.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-primary/20 p-2 sm:p-3 md:p-4 font-sans overflow-x-hidden flex items-stretch md:items-center justify-center">
      {/* Main Container - The "Notebook" */}
      <div className="relative w-full min-h-[calc(100dvh-1rem)] md:h-[calc(100vh-2rem)] bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-4 sm:border-[6px] md:border-8 border-primary/40 flex flex-col md:flex-row">
        
        {/* Decorative Binding Rings (Visual Only) */}
        <div className="absolute left-0 md:left-[280px] top-0 bottom-0 w-8 z-20 hidden md:flex flex-col justify-evenly pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-6 h-6 -ml-3 rounded-full bg-stone-300 shadow-inner border border-stone-400"></div>
          ))}
        </div>

        {/* Floating Header */}
        <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-3.5rem)] sm:w-auto">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur-md px-3 sm:px-6 py-2 rounded-full shadow-lg border border-primary/20 flex items-center justify-center gap-2 sm:gap-4"
          >
            <img src="/favicon.png" alt="V.I.D.H.Y.A Logo" className="w-8 h-8 rounded-lg" />
            <img src="/Logo2.png" alt="V.I.D.H.Y.A" className="h-5 sm:h-6 w-auto" />
            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block"></div>
            <span className="text-sm text-slate-600 hidden sm:inline max-w-[180px] truncate">{user?.username || user?.email}</span>
            <div className="relative group">
              <button
                onClick={logout}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <span className="pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Logout
              </span>
            </div>
          </motion.div>
        </div>

        {/* Sidebar / Index */}
        <div className="hidden md:flex flex-col w-[280px] bg-slate-50 border-r border-slate-200 relative pt-24 pb-8 px-4 overflow-y-auto">
          <div className="space-y-6">
            <div className="pl-4">
              <h3 className="font-hand text-2xl text-slate-500 mb-4">Index</h3>
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => scrollToSection("hero")}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 ${
                  activeSection === "hero" 
                    ? "bg-primary text-white shadow-md" 
                    : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                Welcome
              </button>
              
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => {
                    if (feature.id === 'dsa') {
                      navigate('/dsa');
                    } else if (feature.id === 'resume') {
                      navigate('/career');
                    } else if (feature.id === 'tasks') {
                      navigate('/tasks');
                    } else if (feature.id === 'calendar') {
                      navigate('/calendar');
                    } else if (feature.id === 'personal') {
                      navigate('/profile');
                    } else {
                      scrollToSection(feature.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 ${
                    activeSection === feature.id 
                      ? "bg-white text-primary border border-primary/20 shadow-sm" 
                      : "hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${feature.bgColor} ${feature.color}`}>
                    {feature.icon}
                  </div>
                  {feature.title}
                </button>
              ))}
            </nav>
            
            <div className="mt-auto pt-8 px-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl rotate-1 shadow-sm">
                <p className="font-hand text-yellow-800 text-sm">
                  "The secret to getting ahead is getting started."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-40 md:hidden">
              <Menu className="h-6 w-6 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] bg-slate-50 p-0">
             <div className="flex flex-col h-full pt-16 pb-8 px-4 overflow-y-auto">
              <div className="space-y-6">
                <div className="pl-4">
                  <h3 className="font-hand text-2xl text-slate-500 mb-4">Index</h3>
                </div>
                <nav className="space-y-2">
                  <button 
                    onClick={() => scrollToSection("hero")}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-200 text-slate-600 font-medium flex items-center gap-3"
                  >
                    Welcome
                  </button>
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => {
                        if (feature.id === 'dsa') {
                          navigate('/dsa');
                        } else if (feature.id === 'resume') {
                          navigate('/career');
                        } else if (feature.id === 'tasks') {
                          navigate('/tasks');
                        } else if (feature.id === 'calendar') {
                          navigate('/calendar');
                        } else if (feature.id === 'personal') {
                          navigate('/profile');
                        } else {
                          scrollToSection(feature.id);
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-200 text-slate-600 font-medium flex items-center gap-3"
                    >
                      <div className={`p-1.5 rounded-md ${feature.bgColor} ${feature.color}`}>
                        {feature.icon}
                      </div>
                      {feature.title}
                    </button>
                  ))} 
                </nav>
              </div>
             </div>
          </SheetContent>
        </Sheet>

        {/* Main Content Area - Notebook Paper */}
        <main className="flex-1 notebook-paper relative overflow-y-auto scroll-smooth pt-24 sm:pt-28 pb-10 sm:pb-12 px-4 sm:px-6 md:px-12 lg:px-16">
          
          {/* Hero Section */}
          <section id="hero" className="min-h-[70vh] md:min-h-[80vh] flex flex-col justify-center mb-20 md:mb-24 relative">
             {/* Doodles/Decorations */}
            <motion.div 
              initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
              animate={{ rotate: -5, scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-10 right-0 md:right-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-60" 
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 max-w-2xl relative z-10"
            >
              <div className="inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-full text-sm font-medium font-hand -rotate-2">
                Your entire student life, organized.
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-slate-800">
                V.I.D.<span className="text-primary underline decoration-wavy decoration-4 underline-offset-4">H.Y.A</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-slate-600 md:pr-12 leading-relaxed">
                A personal student productivity ecosystem. Centralize your academic goals, DSA progress, and career planning in one intuitive notebook.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="rounded-full bg-primary hover:bg-primary/90 text-white px-8 h-14 text-lg shadow-xl shadow-primary/20"
                  onClick={() => scrollToSection(features[0].id)}
                  data-testid="button-see-features"
                >
                  Explore Features <ArrowRight className="ml-2 w-5 h-5" />
                </Button>                
              </div>
            </motion.div>
          </section>

          {/* Features Sections */}
          <div className="space-y-20 md:space-y-32">
            {features.map((feature, index) => (
              <section key={feature.id} id={feature.id} className="scroll-mt-32">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className={`p-4 rounded-2xl ${feature.bgColor} ${feature.color} shrink-0`}>
                    {/* Render larger icon clone */}
                    {feature.id === 'dsa' && <Code2 className="w-8 h-8" />}
                    {feature.id === 'resume' && <FileText className="w-8 h-8" />}
                    {feature.id === 'ai' && <Bot className="w-8 h-8" />}
                    {feature.id === 'tasks' && <CheckSquare className="w-8 h-8" />}
                    {feature.id === 'calendar' && <CalendarIcon className="w-8 h-8" />}
                    {feature.id === 'personal' && <User className="w-8 h-8" />}
                  </div>
                  
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-3xl font-bold text-slate-800 font-hand">{feature.title}</h2>
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                    
                   
                  </div>
                </div>
              </section>
            ))}
            
            {/* Call to Action Footer inside Notebook */}
            <section className="py-14 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-hand text-slate-800 mb-6">Ready to get organized?</h2>
              <Button size="lg" className="rounded-full bg-primary text-white hover:bg-primary/90 px-7 sm:px-10 h-14 sm:h-16 text-lg sm:text-xl shadow-xl shadow-primary/25 transition-transform hover:scale-105 active:scale-95">
                Join V.I.D.H.Y.A Now
              </Button>
            </section>
          </div>
        </main>

        {/* Right Sidebar - Notebook Dashboard */}
        <aside className="hidden lg:flex flex-col w-80 bg-amber-50/30 border-l-2 border-dashed border-amber-300/60 relative pt-24 pb-8 px-5 overflow-y-auto">
          {/* Notebook lines background */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #d4a574 28px)', backgroundSize: '100% 28px', opacity: 0.15 }} />
          
          <div className="relative space-y-6">
            
            {/* Tasks Section */}
            <div 
              onClick={() => navigate('/tasks')}
              className="group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-5 h-5 text-amber-700" />
                <h4 className="font-hand text-xl text-amber-900">My Tasks</h4>
                <ArrowRight className="w-4 h-4 text-amber-500 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              
              {stats.loadingTasks ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-1 pl-1">
                  <p className="font-hand text-slate-700">
                    <span className="text-2xl font-bold text-amber-800">{stats.activeTasks}</span>
                    <span className="text-sm ml-1">tasks waiting</span>
                  </p>
                  <p className="font-hand text-slate-600 text-sm">
                    ✓ {stats.completedToday} done today
                  </p>
                  {stats.maxStreak > 0 && (
                    <p className="font-hand text-amber-700 text-sm flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {stats.maxStreak} day streak!
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-amber-300/50" />

            {/* Calendar Section */}
            <div 
              onClick={() => navigate('/calendar')}
              className="group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-amber-700" />
                <h4 className="font-hand text-xl text-amber-900">Upcoming</h4>
                <ArrowRight className="w-4 h-4 text-amber-500 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              
              {stats.loadingCalendar ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                </div>
              ) : stats.upcomingEvents.length > 0 ? (
                <ul className="space-y-2 pl-1">
                  {stats.upcomingEvents.map((event, idx) => {
                    const isToday = new Date().toDateString() === event.date.toDateString();
                    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === event.date.toDateString();
                    const dayLabel = isToday ? 'today' : isTomorrow ? 'tomorrow' : event.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                    
                    return (
                      <li key={idx} className="font-hand text-sm text-slate-700">
                        <span className={`${isToday ? 'text-red-700 font-bold' : isTomorrow ? 'text-amber-800' : ''}`}>
                          • {event.title}
                        </span>
                        <span className={`text-xs ml-1 ${isToday ? 'text-red-600' : 'text-slate-500'}`}>({dayLabel})</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="font-hand text-slate-500 text-sm pl-1 italic">
                  Nothing this week — add something!
                </p>
              )}
            </div>

            {/* Sticky Note */}
            <div className="mt-auto pt-6">
              <div className="p-4 bg-yellow-100 border border-yellow-300/80 rounded shadow-sm -rotate-1 relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-yellow-200/90 rounded-sm" />
                <p className="font-hand text-yellow-900 text-sm leading-relaxed">
                  "Start where you are. Use what you have. Do what you can."
                </p>
                <p className="font-hand text-yellow-700/70 text-xs mt-2 text-right">— Arthur Ashe</p>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
