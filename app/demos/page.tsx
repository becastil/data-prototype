"use client";

import React from "react";
import Link from "next/link";

export default function DemosIndexPage() {
  const demos = [
    {
      href: "/variants",
      title: "Animated Variants Menu",
      description: "Framer Motion sidebar/menu variants demo.",
    },
    {
      href: "/demos/buttons",
      title: "Buttons",
      description: "Soft gray Gallagher-styled buttons.",
    },
    {
      href: "/demos/dropdown",
      title: "Soft Dropdown",
      description: "Quick navigate dropdown with descriptions.",
    },
    {
      href: "/demos/theme",
      title: "Theme Preview",
      description: "Gallagher theme components overview.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-heading text-black">Demos & Prototypes</h1>
          <p className="text-gray-600 mt-2">Explore UI experiments included in this prototype.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demos.map((demo) => (
            <Link key={demo.href} href={demo.href} className="panel-elevated p-5 rounded-xl hover:brightness-95 transition">
              <h2 className="text-lg font-semibold text-black font-heading">{demo.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{demo.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

