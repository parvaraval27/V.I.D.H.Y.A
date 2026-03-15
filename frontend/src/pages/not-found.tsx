import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Book Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Book Pages Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        
        {/* Page Lines */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-20 right-20 h-px bg-amber-200/30"
            style={{ top: `${(i + 1) * 3.3}%` }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-6xl w-full mx-auto">
          <div className="text-center mb-12">
            {/* Chapter Title */}
            <div className="inline-block px-5 sm:px-6 py-2 bg-amber-100 border-2 border-amber-300 rounded-full mb-6">
              <span className="text-amber-800 font-serif text-base sm:text-lg">Chapter 404</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif text-amber-900 mb-6">
              Page Not Found
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-amber-700 font-serif italic max-w-2xl mx-auto">
              "Every story must come to an end, but this chapter was never written."
            </p>
          </div>

          {/* Book Cover */}
          <div className="flex justify-center mb-12">
            <div className="relative group">
              {/* Book Shadow */}
              <div className="absolute inset-0 bg-amber-900/20 rounded-lg transform rotate-3 scale-105 group-hover:rotate-2 transition-transform duration-300"></div>
              
              {/* Book Cover */}
              <div className="relative bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg p-8 shadow-2xl transform rotate-1 group-hover:rotate-0 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 to-transparent rounded-lg"></div>
                
                {/* Cover Image */}
                <div className="relative z-10 w-64 h-64 mx-auto mb-6">
                  <img 
                    src="/notfound.png" 
                    alt="404 Not Found" 
                    className="w-full h-full object-cover rounded-lg shadow-inner"
                  />
                </div>
                
                {/* Cover Title */}
                <div className="text-center text-white">
                  <h2 className="text-2xl font-serif mb-2">'हे पार्थ, तुम भटक गए हो'</h2>
                  <p className="text-amber-200 text-xs sm:text-sm">Volume I, Issue 404</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="text-center space-y-6">
          
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-amber-300/50 transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => navigate('/')}
              >
                <Home className="mr-2 w-5 h-5" />
                Return to Title Page
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-amber-400 text-amber-700 hover:bg-amber-50 px-8 py-4 rounded-lg transition-all duration-300"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Previous Page
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
