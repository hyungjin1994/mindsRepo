"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import QuickGameCard from "./components/QuickGameCard";
import Reminders from "./components/Reminders";
import FamilyFeed from "./components/FamilyFeed";
import HelpModal from "./components/HelpModal";
import PushSubscribe from "./components/PushSubscribe";

export default function Home() {
  const [helpOpen, setHelpOpen] = useState(false);

  // initial mock state; will be replaced by API data if available
  const [user, setUser] = useState({ id: "u1", name: "어머니", points: 124 });
  const [reminders, setReminders] = useState<any[]>([
    { id: "r1", type: "약", title: "아침 약", time: "08:00", completed: false },
  ]);
  const [feed, setFeed] = useState<any[]>([{ id: "f1", sender: "아들", text: "사진 보냈어요.", imageUrl: "/sample1.jpg", createdAt: new Date().toISOString() }]);

  // fetch dashboard data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          if (json.user) setUser(json.user);
          if (json.reminders) setReminders(json.reminders);
          if (json.familyFeed) setFeed(json.familyFeed);
        }
      } catch (e) {
        // ignore, keep mock data
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-5 py-8">
        <DashboardHeader name={user.name} points={user.points} onOpenHelp={() => setHelpOpen(true)} />

        <section className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-5">
            <QuickGameCard />
            <Reminders reminders={reminders} userId={user.id} />
          </div>
          <aside className="space-y-5">
            <FamilyFeed items={feed} />
            <PushSubscribe userId={user.id} />
          </aside>
        </section>

        <p className="mt-8 rounded-2xl bg-amber-50/70 px-4 py-3 text-center text-base text-amber-800">
          💡 글자 크기와 고대비는 화면 맨 위 설정에서 바꿀 수 있어요.
        </p>

        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </main>
    </div>
  );
}
