"use client";

import { Search } from "lucide-react";

interface SearchBarProps {           
  placeholder?: string;  
  onSearch?: (value: string) => void;
}

export function SearchBar({ placeholder, onSearch }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
        size={20} 
      />
      
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)} 
        className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
      />
    </div>
  );
}