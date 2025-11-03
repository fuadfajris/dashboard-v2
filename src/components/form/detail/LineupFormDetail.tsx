"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type Guest = {
  id: number;
  name: string;
  category: string;
  image?: string;
};

export type LineUpData = {
  id?:number;
  event_id: number;
  guest_id: number;
  stage: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  guest?: Guest;
};

export type ActivityLineup = {
  id: number;
  content_key: string;
  content_name: string;
  status: "pending" | "approved" | "rejected";
  prevValue?: LineUpData;
  newValue: LineUpData;
  maker: { name: string; email: string };
  created_at: string;
};

type Props = {
  mode?: "activity" | "detail";
  activity?: ActivityLineup;
  prevValue?: LineUpData;
  newValue?: LineUpData;
  onAction?: (action: "approve" | "reject") => void;
};

export default function LineupFormDetail({
  mode = "activity",
  prevValue,
  newValue,
}: Props) {
  const [showAfter, setShowAfter] = useState(true);

  const displayLineup: LineUpData | undefined =
    (mode === "activity" && showAfter && newValue) || mode === "detail"
      ? newValue
      : prevValue;

  if (!displayLineup) return <div>No data available</div>;

  const showToggle = mode === "activity" && prevValue && newValue;

  // 🔍 Fungsi untuk deteksi perubahan
  const isChanged = (field: keyof LineUpData) => {
    if (!prevValue || !newValue) return false;

    // Cek nested guest name juga
    if (field === "guest") {
      return prevValue.guest?.name !== newValue.guest?.name;
    }

    return prevValue[field] !== newValue[field];
  };

  // 🔧 Helper class
  const highlightClass = (field: keyof LineUpData) =>
    showAfter && isChanged(field)
      ? "bg-yellow-100 dark:bg-yellow-800 rounded"
      : "";

  return (
    <div>
      {showToggle && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={showAfter ? "default" : "outline"}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
            onClick={() => setShowAfter(true)}
          >
            After
          </Button>
          <Button
            variant={!showAfter ? "default" : "outline"}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
            onClick={() => setShowAfter(false)}
          >
            Before
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 rounded-lg border dark:border-gray-600 p-6 mt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={highlightClass("guest")}>
              <strong>Guest:</strong>{" "}
              {displayLineup.guest?.name || displayLineup.guest_id}
            </div>
            <div className={highlightClass("stage")}>
              <strong>Stage:</strong> {displayLineup.stage}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={highlightClass("schedule_date")}>
              <strong>Date:</strong> {displayLineup.schedule_date}
            </div>
            <div className={highlightClass("start_time")}>
              <strong>Start Time:</strong> {displayLineup.start_time}
            </div>
            <div className={highlightClass("end_time")}>
              <strong>End Time:</strong> {displayLineup.end_time}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
