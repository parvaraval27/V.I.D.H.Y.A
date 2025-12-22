import { useState } from "react";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [activeSection, setActiveSection] = useState("hero");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      description: "Smart productivity tracking with recurring reminders and analytics.",
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
      description: "Mood tracking, journaling, and a space to be yourself.",
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
    <div className="min-h-screen bg-primary/20 p-4 md:p-8 font-sans overflow-hidden flex items-center justify-center">
      {/* Main Container - The "Notebook" */}
      <div className="relative w-full max-w-7xl h-[calc(100vh-4rem)] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-primary/40 flex flex-col md:flex-row">
        
        {/* Decorative Binding Rings (Visual Only) */}
        <div className="absolute left-0 md:left-[280px] top-0 bottom-0 w-8 z-20 flex flex-col justify-evenly pointer-events-none hidden md:flex">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-6 h-6 -ml-3 rounded-full bg-stone-300 shadow-inner border border-stone-400"></div>
          ))}
        </div>

        {/* Floating Header */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-primary/20 flex items-center gap-4"
          >
            <img src="/favicon.png" alt="V.I.D.H.Y.A Logo" className="w-8 h-8 rounded-lg" />
            <img src="/Logo2.png" alt="V.I.D.H.Y.A" className="h-6 w-auto" />
            <div className="h-4 w-[1px] bg-border mx-1"></div>
            <span className="text-sm text-slate-600 hidden sm:inline">{user?.username || user?.email}</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-full"
              onClick={logout}
            >
              Logout
            </Button>
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
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-40 md:hidden">
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
        <main className="flex-1 notebook-paper relative overflow-y-auto scroll-smooth pt-28 pb-12 px-6 md:px-16">
          
          {/* Hero Section */}
          <section id="hero" className="min-h-[80vh] flex flex-col justify-center mb-24 relative">
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
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-800">
                V.I.D.<span className="text-primary underline decoration-wavy decoration-4 underline-offset-4">H.Y.A</span>
              </h1>
              
              <p className="text-xl text-slate-600 md:pr-12 leading-relaxed">
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
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full border-2 border-slate-200 hover:border-primary/50 hover:bg-primary/5 px-8 h-14 text-lg"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>
            </motion.div>
          </section>

          {/* Features Sections */}
          <div className="space-y-32">
            {features.map((feature, index) => (
              <section key={feature.id} id={feature.id} className="scroll-mt-32">
                <div className="flex flex-col md:flex-row gap-8 items-start">
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
                    <p className="text-lg text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                    
                   
                  </div>
                </div>
              </section>
            ))}
            
            {/* Call to Action Footer inside Notebook */}
            <section className="py-20 text-center">
              <h2 className="text-4xl font-bold font-hand text-slate-800 mb-6">Ready to get organized?</h2>
              <Button size="lg" className="rounded-full bg-primary text-white hover:bg-primary/90 px-10 h-16 text-xl shadow-xl shadow-primary/25 transition-transform hover:scale-105 active:scale-95">
                Join V.I.D.H.Y.A Now
              </Button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
