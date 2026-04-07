import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";

const allCountryOptions = Object.entries(countries)
  .map(([code, data]) => ({
    code,
    name: data.name,
    dialCode: `+${data.phone[0]}`,
    emoji: getEmojiFlag(code as TCountryCode),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface CountryCodeSelectProps {
  value: string;
  onChange: (dialCode: string) => void;
  searchPlaceholder?: string;
}

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value,
  onChange,
  searchPlaceholder = "Search...",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = allCountryOptions.find((o) => o.dialCode === value);

  const filtered = query.trim()
    ? allCountryOptions.filter(
        (o) =>
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.dialCode.includes(query)
      )
    : allCountryOptions;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (dialCode: string) => {
    onChange(dialCode);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-[35%] shrink-0" dir="ltr">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-full p-4 pr-8 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-center text-app-text cursor-pointer flex items-center justify-center gap-1 select-none"
      >
        <span className="text-base leading-none">{selected?.emoji}</span>
        <span className="text-sm font-medium">{selected?.dialCode ?? value}</span>
        <ChevronDown
          size={14}
          className={`text-app-textSec/50 transition-transform duration-200 absolute right-3 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 left-0 top-[calc(100%+4px)] w-72 bg-white rounded-2xl shadow-xl border border-app-card/40 overflow-hidden"
          style={{ maxHeight: "320px", display: "flex", flexDirection: "column" }}
        >
          {/* Search */}
          <div className="p-2 border-b border-app-card/30 flex items-center gap-2">
            <Search size={15} className="text-app-textSec/50 shrink-0 ml-1" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm outline-none text-app-text placeholder:text-app-textSec/40 bg-transparent py-1"
              dir="ltr"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-app-textSec/40 hover:text-app-textSec shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* List */}
          <ul
            ref={listRef}
            className="overflow-y-auto flex-1"
            style={{ maxHeight: "260px" }}
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-app-textSec/60 text-center">
                No results
              </li>
            ) : (
              filtered.map((option) => (
                <li key={option.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.dialCode)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-app-gold/5 transition-colors ${
                      option.dialCode === value
                        ? "bg-app-gold/10 text-app-gold font-semibold"
                        : "text-app-text"
                    }`}
                  >
                    <span className="text-base w-6 shrink-0">{option.emoji}</span>
                    <span className="font-medium w-12 shrink-0 text-app-textSec">
                      {option.dialCode}
                    </span>
                    <span className="truncate">{option.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
