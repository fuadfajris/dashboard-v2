"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type EventData = {
  id: number;
  name: string;
  location: string;
  description: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: boolean;
  image_venue?: string | null;
  hero_image?: string | null;
};

type Props = {
  mode?: "activity" | "detail";
  event?: EventData;
  prevValue?: EventData;
  newValue?: EventData;
};

export default function EventFormDetail({
  mode = "detail",
  event,
  prevValue,
  newValue,
}: Props) {
  const [showAfter, setShowAfter] = useState(true);

  const displayEvent: EventData | undefined =
    mode === "activity" ? (showAfter ? newValue : prevValue) : event;

  if (!displayEvent) return <div>No data available</div>;

  const showToggle = mode === "activity" && prevValue && newValue;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // 🔍 Deteksi perubahan antar nilai
  const isChanged = (field: keyof EventData) => {
    if (!prevValue || !newValue) return false;
    return prevValue[field] !== newValue[field];
  };

  // ✨ Tambah class highlight jika berubah
  const highlightClass = (field: keyof EventData) =>
    showAfter && isChanged(field)
      ? "bg-yellow-100 dark:bg-yellow-800 rounded transition-all duration-300"
      : "";

  return (
    <div className="grid gap-4">
      {/* Tombol switch Before/After */}
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

      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
        {/* Event name & location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("name")}`}>
            <strong>Event Name:</strong> {displayEvent.name}
          </p>
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("location")}`}>
            <strong>Location:</strong> {displayEvent.location}
          </p>
        </div>

        {/* Description */}
        <div className={highlightClass("description")}>
          <p className="text-gray-800 dark:text-white/90 pb-2">
            <strong>Description:</strong>
          </p>
          <p className="text-gray-800 dark:text-white/90 pb-2">
            {displayEvent.description}
          </p>
        </div>

        {/* Start - End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("start_date")}`}>
            <strong>Start Date:</strong> {formatDate(displayEvent.start_date)}
          </p>
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("end_date")}`}>
            <strong>End Date:</strong> {formatDate(displayEvent.end_date)}
          </p>
        </div>

        {/* Capacity and status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("capacity")}`}>
            <strong>Capacity:</strong> {displayEvent.capacity}
          </p>
          <p className={`text-gray-800 dark:text-white/90 pb-2 ${highlightClass("status")}`}>
            <strong>Status:</strong>{" "}
            {displayEvent.status ? (
              <Badge className="bg-green-500">Active</Badge>
            ) : (
              <Badge className="bg-gray-400">Inactive</Badge>
            )}
          </p>
        </div>

        {/* Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayEvent.image_venue && (
            <div className={highlightClass("image_venue")}>
              <p className="text-gray-800 dark:text-white/90 pb-2">
                <strong>Venue Image:</strong>
              </p>
              <div className="w-full h-48 relative rounded overflow-hidden border">
                <Image
                  src={displayEvent.image_venue}
                  alt="Venue Image"
                  width={100}
                  height={100}
                  className="object-cover h-48 w-auto transition-all duration-300"
                />
              </div>
            </div>
          )}

          {displayEvent.hero_image && (
            <div className={highlightClass("hero_image")}>
              <p className="text-gray-800 dark:text-white/90 pb-2">
                <strong>Hero Image:</strong>
              </p>
              <div className="w-full h-48 relative rounded overflow-hidden border">
                <Image
                  src={displayEvent.hero_image}
                  alt="Hero Image"
                  width={100}
                  height={100}
                  className="object-cover h-48 w-auto transition-all duration-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
