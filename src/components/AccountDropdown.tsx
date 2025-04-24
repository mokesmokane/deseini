import { useState, useRef, useEffect } from "react";

interface AccountDropdownProps {
  onAccount: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export default function AccountDropdown({ onAccount, onLogout, userEmail }: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center px-4 py-2 rounded-full border border-black bg-white hover:bg-black hover:text-white transition-colors focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="font-semibold mr-2">{userEmail ? userEmail : "Account"}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-black rounded-lg shadow-lg z-50 animate-fade-in">
          <button
            className="block w-full text-left px-4 py-3 hover:bg-black hover:text-white transition-colors rounded-t-lg"
            onClick={() => { setOpen(false); onAccount(); }}
          >
            Account
          </button>
          <button
            className="block w-full text-left px-4 py-3 hover:bg-black hover:text-white transition-colors rounded-b-lg border-t border-gray-200"
            onClick={() => { setOpen(false); onLogout(); }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
