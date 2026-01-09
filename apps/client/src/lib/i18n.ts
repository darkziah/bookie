// Multi-language support for English and Tagalog
type Language = "en" | "tl";

const translations = {
  // Common
  "app.name": {
    en: "Bookie Library",
    tl: "Aklatan ng Bookie",
  },
  "app.tagline": {
    en: "School Library Management System",
    tl: "Sistema ng Pamamahala ng Aklatan ng Paaralan",
  },

  // Navigation
  "nav.dashboard": {
    en: "Dashboard",
    tl: "Dashboard",
  },
  "nav.circulation": {
    en: "Circulation",
    tl: "Sirkulasyon",
  },
  "nav.catalog": {
    en: "Catalog",
    tl: "Katalogo",
  },
  "nav.students": {
    en: "Students",
    tl: "Mga Mag-aaral",
  },
  "nav.reports": {
    en: "Reports",
    tl: "Mga Ulat",
  },
  "nav.settings": {
    en: "Settings",
    tl: "Mga Setting",
  },
  "nav.inventory": {
    en: "Inventory",
    tl: "Imbentaryo",
  },
  "nav.import": {
    en: "Import",
    tl: "Mag-import",
  },

  // Dashboard
  "dashboard.totalBooks": {
    en: "Total Books",
    tl: "Kabuuang Libro",
  },
  "dashboard.activeLoans": {
    en: "Active Loans",
    tl: "Aktibong Pahiram",
  },
  "dashboard.overdueBooks": {
    en: "Overdue Books",
    tl: "Mga Nahuling Libro",
  },
  "dashboard.totalStudents": {
    en: "Total Students",
    tl: "Kabuuang Mag-aaral",
  },

  // Circulation
  "circulation.checkout": {
    en: "Checkout",
    tl: "Pahiram",
  },
  "circulation.checkin": {
    en: "Check In",
    tl: "Ibalik",
  },
  "circulation.renew": {
    en: "Renew",
    tl: "I-renew",
  },
  "circulation.dueDate": {
    en: "Due Date",
    tl: "Petsa ng Pagbabalik",
  },
  "circulation.overdue": {
    en: "Overdue",
    tl: "Nahuli",
  },

  // Catalog
  "catalog.addBook": {
    en: "Add Book",
    tl: "Magdagdag ng Libro",
  },
  "catalog.editBook": {
    en: "Edit Book",
    tl: "I-edit ang Libro",
  },
  "catalog.searchBooks": {
    en: "Search books...",
    tl: "Maghanap ng libro...",
  },
  "catalog.title": {
    en: "Title",
    tl: "Pamagat",
  },
  "catalog.author": {
    en: "Author",
    tl: "May-akda",
  },
  "catalog.isbn": {
    en: "ISBN",
    tl: "ISBN",
  },
  "catalog.category": {
    en: "Category",
    tl: "Kategorya",
  },
  "catalog.condition": {
    en: "Condition",
    tl: "Kalagayan",
  },
  "catalog.location": {
    en: "Location",
    tl: "Lokasyon",
  },

  // Students
  "students.addStudent": {
    en: "Add Student",
    tl: "Magdagdag ng Mag-aaral",
  },
  "students.gradeLevel": {
    en: "Grade Level",
    tl: "Antas ng Baitang",
  },
  "students.borrowingLimit": {
    en: "Borrowing Limit",
    tl: "Limitasyon sa Paghiram",
  },
  "students.activeLoans": {
    en: "Active Loans",
    tl: "Aktibong Pahiram",
  },

  // Common Actions
  "action.save": {
    en: "Save",
    tl: "I-save",
  },
  "action.cancel": {
    en: "Cancel",
    tl: "Kanselahin",
  },
  "action.delete": {
    en: "Delete",
    tl: "Burahin",
  },
  "action.edit": {
    en: "Edit",
    tl: "I-edit",
  },
  "action.search": {
    en: "Search",
    tl: "Maghanap",
  },
  "action.export": {
    en: "Export",
    tl: "I-export",
  },
  "action.print": {
    en: "Print",
    tl: "I-print",
  },

  // Status
  "status.available": {
    en: "Available",
    tl: "Magagamit",
  },
  "status.borrowed": {
    en: "Borrowed",
    tl: "Nahiram",
  },
  "status.reserved": {
    en: "Reserved",
    tl: "Nakalaan",
  },
  "status.missing": {
    en: "Missing",
    tl: "Nawawala",
  },
  "status.active": {
    en: "Active",
    tl: "Aktibo",
  },
  "status.inactive": {
    en: "Inactive",
    tl: "Hindi Aktibo",
  },

  // Messages
  "message.success": {
    en: "Success!",
    tl: "Tagumpay!",
  },
  "message.error": {
    en: "Error",
    tl: "Error",
  },
  "message.loading": {
    en: "Loading...",
    tl: "Naglo-load...",
  },
  "message.noResults": {
    en: "No results found",
    tl: "Walang nakitang resulta",
  },
  "message.confirmDelete": {
    en: "Are you sure you want to delete this?",
    tl: "Sigurado ka bang gusto mong burahin ito?",
  },
};

type TranslationKey = keyof typeof translations;

// Get current language from localStorage or default to English
function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("bookie-language") as Language) || "en";
}

// Set language preference
function setLanguage(lang: Language): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("bookie-language", lang);
    window.dispatchEvent(new CustomEvent("languageChange", { detail: lang }));
  }
}

// Translation function
function t(key: TranslationKey): string {
  const lang = getLanguage();
  return translations[key]?.[lang] || key;
}

// Hook for React components
import { useState, useEffect } from "react";

function useLanguage() {
  const [language, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handler = (e: CustomEvent<Language>) => setLang(e.detail);
    window.addEventListener("languageChange", handler as EventListener);
    return () => window.removeEventListener("languageChange", handler as EventListener);
  }, []);

  return {
    language,
    setLanguage: (lang: Language) => {
      setLanguage(lang);
      setLang(lang);
    },
    t,
  };
}

export { t, useLanguage, setLanguage, getLanguage, type Language, type TranslationKey };
