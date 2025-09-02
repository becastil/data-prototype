"use client";

import React from "react";
import SoftDropdown, { SoftDropdownItem } from "@components/ui/soft-dropdown";
import { BarChart3, FileText, Settings, Users } from "lucide-react";

export default function DropdownDemoPage() {
  const items: SoftDropdownItem[] = [
    { id: "dashboard", label: "Dashboard", description: "Summary & metrics", icon: <BarChart3 className="size-4" /> },
    { id: "reports", label: "Reports", description: "Financial exports", icon: <FileText className="size-4" /> },
    { id: "team", label: "Team", description: "User management", icon: <Users className="size-4" /> },
    { id: "settings", label: "Settings", description: "Preferences", icon: <Settings className="size-4" /> },
  ];

  const [selected, setSelected] = React.useState<string | undefined>(items[0].id);

  return (
    <main className="min-h-screen gradient-smooth p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold text-black">Soft Dropdown Demo</h1>
          <p className="mt-2 text-gray-600">Soft gray dropdown inspired by docs/ideas/drop down.jpg.</p>
        </header>

        <section className="panel-elevated p-6">
          <div className="flex flex-wrap items-center gap-4">
            <SoftDropdown
              label="Quick Navigate"
              items={items}
              selectedId={selected}
              onSelect={setSelected}
            />
            <div className="text-sm text-gray-700">
              Selected: <span className="font-medium">{items.find(i => i.id === selected)?.label}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

