import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
} from "lucide-react";

const sidebarVariants = {
  open: { width: "280px" },
  closed: { width: "48px" },
};

const transitionProps = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.6,
};

const ToggleButton = ({ isOpen, onToggle }) => {
  return (
    <Button
      className="group relative"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <svg
        className="pointer-events-none"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef233c"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 12L20 12"
          className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
        />
        <path
          d="M4 12H20"
          className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
        />
        <path
          d="M4 12H20"
          className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
        />
      </svg>
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 bg-[#ef233c]/0 group-hover:bg-[#ef233c]/5 rounded-lg transition-colors" />
    </Button>
  );
};

export function SessionNavBar({ children, fileCount = 0, branch = "main", isLocked = false, onToggle, searchTerm, setSearchTerm }) {
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState("");
  const searchInputRef = useRef(null);

  const isOpen = isLocked || isHovered;

  const handleSearchClick = () => {
    if (!isLocked && !isHovered) {
        onToggle(); // Expand if closed
    }
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 100);
  };

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-50 h-full shrink-0 border-r border-[#ef233c]/20 bg-[#020206] backdrop-blur-[25px] hidden md:flex",
        !isOpen && "is-collapsed"
      )}
      initial={isOpen ? "open" : "closed"}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
         borderRight: '1px solid rgba(239, 35, 60, 0.2)',
         boxShadow: isOpen ? '0 0 40px rgba(239, 35, 60, 0.05)' : 'none'
      }}
    >
      {/* Activity Bar (Permanent Gutter) */}
      <div className="absolute left-0 top-0 bottom-0 w-[48px] z-50 flex flex-col items-center py-4 border-r border-[#ef233c]/10 bg-[#020206]">
        <div className="mb-6">
            <img src="/logo-icon.png" alt="G" className="w-12 h-12 object-contain transition-all" />
        </div>

        <div className="mb-10">
            <ToggleButton isOpen={isLocked} onToggle={onToggle} />
        </div>
        
        <div className="flex flex-col gap-12 items-center w-full mt-6">
          <div className="relative group cursor-pointer">
            <div className={cn(
              "absolute -left-[18px] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#ef233c] shadow-[0_0_12px_#ef233c] transition-opacity",
              !isOpen && "opacity-0"
            )} />
            <FileText size={30} className={cn(
               "transition-all hover:scale-110",
               isOpen ? "text-[#ef233c] drop-shadow-[0_0_10px_rgba(239,35,60,0.5)]" : "text-white/20"
            )} />
          </div>
        </div>
      </div>

      {/* Main Sidebar Content (Expandable) */}
      <div className={cn(
        "relative flex h-full flex-col pl-[48px] transition-opacity duration-500",
        !isOpen ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      )}>
        {/* Sidebar Header (Centered Logo & Label) */}
        <div className="sidebar-header flex flex-col items-center justify-center h-[84px] px-6 border-b border-[#ef233c]/15 bg-[#ef233c]/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-[#ef233c] text-[10px] animate-pulse">⬡</span>
            <span className="text-[15px] font-extrabold tracking-[0.25em] text-white/40 uppercase font-manrope">PROJECT STRUCTURE</span>
          </div>
        </div>

        {/* Search Input Area */}
        <div className="px-4 py-3 border-b border-[#ef233c]/5">
            <div className="relative group">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ef233c]/40 group-focus-within:text-[#ef233c] transition-colors" />
                <input 
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-[#ef233c]/20 hover:border-[#ef233c]/40 focus:border-[#ef233c]/60 focus:outline-none rounded pl-8 pr-3 py-1.5 font-mono text-[11px] text-white/80 placeholder:text-zinc-600 transition-all"
                />
            </div>
        </div>

        <div className="flex grow w-full flex-col overflow-hidden">
          <ScrollArea className="flex-1 w-full font-mono">
            <div className="px-4 pb-4 mt-2 text-[11px]">
              {children}
            </div>
          </ScrollArea>
        </div>

        {/* Technical Footer */}
        <motion.div 
          className="mt-auto border-t border-[#ef233c]/10 p-4 font-mono text-[9px] tracking-tight text-white/40 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-500/50"></span> 
            <span>branch: {branch}</span>
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <span className="text-zinc-500">nodes:</span>
            <span>{fileCount}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
