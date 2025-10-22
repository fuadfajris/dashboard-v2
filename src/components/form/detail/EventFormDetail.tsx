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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const showToggle = mode === "activity" && prevValue && newValue;

  return (
    <div className="space-y-4">
      {showToggle && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={showAfter ? "default" : "outline"}
            onClick={() => setShowAfter(true)}
          >
            After
          </Button>
          <Button
            variant={!showAfter ? "default" : "outline"}
            onClick={() => setShowAfter(false)}
          >
            Before
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="space-y-2 grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-6">
          <strong>Name:</strong> {displayEvent.name}
        </div>
        <div className="col-span-12 md:col-span-6">
          <strong>Location:</strong> {displayEvent.location}
        </div>
        <div className="col-span-12">
          <strong>Description:</strong> {displayEvent.description}
        </div>
        <div className="col-span-12 md:col-span-6">
          <strong>Start Date:</strong> {formatDate(displayEvent.start_date)}
        </div>
        <div className="col-span-12 md:col-span-6">
          <strong>End Date:</strong> {formatDate(displayEvent.end_date)}
        </div>
        <div className="col-span-12 md:col-span-6">
          <strong>Capacity:</strong> {displayEvent.capacity}
        </div>
        <div className="col-span-12 md:col-span-6">
          <strong>Status:</strong>{" "}
          {displayEvent.status ? (
            <Badge className="bg-green-500">Active</Badge>
          ) : (
            <Badge className="bg-gray-400">Inactive</Badge>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        {displayEvent.image_venue && (
          <div>
            <p className="font-semibold">Venue Image</p>
            <div className="w-full h-48 relative border rounded overflow-hidden">
              <Image
                src={displayEvent.image_venue}
                alt="Venue Image"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
        {displayEvent.hero_image && (
          <div>
            <p className="font-semibold">Hero Image</p>
            <div className="w-full h-48 relative border rounded overflow-hidden">
              <Image
                src={displayEvent.hero_image}
                alt="Hero Image"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
