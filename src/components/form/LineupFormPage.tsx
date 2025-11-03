"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";

type Guest = {
  id: number;
  name: string;
  category: string;
  image?: string;
};

type LineUpData = {
  id?: number;
  event_id: number;
  guest_id: number;
  stage: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  guest?: Guest;
};

export default function LineupFormPage() {
  const { user, token } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = Number(searchParams.get("eventId") || 0);
  const lineupId = searchParams.get("lineupId");

  const [lineup, setLineup] = useState<LineUpData>({
    event_id: eventId,
    guest_id: 0,
    stage: "",
    start_time: "",
    end_time: "",
    schedule_date: "",
  });

  const [guests, setGuests] = useState<Guest[]>([]);
  const [eventDetail, setEventDetail] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [initialLineup, setInitialLineup] = useState<LineUpData>({
    event_id: eventId,
    guest_id: 0,
    stage: "",
    start_time: "",
    end_time: "",
    schedule_date: "",
  });

  // Set page title
  useEffect(() => {
    document.title = lineupId ? "Edit Line Up" : "Add Line Up";
  }, [lineupId]);

  // Fetch event detail (untuk min/max tanggal)
  useEffect(() => {
    if (!token || !eventId) return;
    const fetchEventDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events/detail?eventId=${eventId}&merchantId=${user?.merchant_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch event detail");
        const data = await res.json();
        setEventDetail({
          start_date: data.start_date,
          end_date: data.end_date,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchEventDetail();
  }, [token, eventId]);

  // Fetch guest list
  useEffect(() => {
    if (!token) return;
    const fetchGuests = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch guests");
        const data: Guest[] = await res.json();
        setGuests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuests();
  }, [token]);

  // Fetch lineup detail jika edit
  useEffect(() => {
    if (!token || !lineupId) return;
    const fetchLineupDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${lineupId}/detail`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch lineup detail");
        const data: LineUpData = await res.json();
        const result = {
          event_id: Number(data.event_id),
          guest_id: Number(data.guest_id),
          stage: data.stage,
          schedule_date: data.schedule_date,
          start_time: data.start_time,
          end_time: data.end_time,
        };
        setLineup(result);
        setInitialLineup(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLineupDetail();
  }, [token, lineupId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLineup((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitLoading(true);
    try {
      const method = "POST";

      const req = {
        content_key: "lineup",
        content_name: lineupId ? "Edit Line Up" : "Add Line Up",
        prevValue: lineupId
          ? {
              ...initialLineup,
              id: Number(lineupId),
              start_time: formatTime(initialLineup.start_time),
              end_time: formatTime(initialLineup.end_time),
            }
          : null,
        newValue: {
          ...lineup,
          event_id: eventId,
          start_time: formatTime(lineup.start_time),
          end_time: formatTime(lineup.end_time),
          ...(lineupId ? { id: Number(lineupId) } : {}),
        },
        maker: user,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(req),
      });

      if (!res.ok) throw new Error("Failed to save lineup");

      alert("Line Up saved successfully!");
      router.push(`/admin/lineup?eventId=${eventId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save lineup. See console.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const formatTime = (time: string) => {
    return time.split(":").slice(0, 2).join(":");
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white/90">
        {lineupId ? "Edit Line Up" : "Add Line Up"}
      </h1>

      <div className="space-y-4">
        {/* Guest select */}
        <div>
          <label className="block text-sm text-gray-800 dark:text-white/90 pb-2">
            Guest
          </label>
          <select
            name="guest_id"
            value={lineup.guest_id}
            onChange={handleChange}
            className="w-full border p-2 rounded mt-1 bg-input"
            disabled={!!lineupId}
          >
            <option value="" className="!text-gray-800">-- Select Guest --</option>
            {guests.map((g) => (
              <option className="!text-gray-800" key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm text-gray-800 dark:text-white/90 pb-2">
            Stage
          </label>
          <input
            type="text"
            name="stage"
            value={lineup.stage}
            onChange={handleChange}
            className="w-full border p-2 rounded mt-1 bg-input"
            placeholder="Stage name"
            required
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm text-gray-800 dark:text-white/90 pb-2">
              Date
            </label>
            <input
              type="date"
              name="schedule_date"
              value={lineup.schedule_date}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1 bg-input"
              min={eventDetail ? formatDate(eventDetail.start_date) : undefined}
              max={eventDetail ? formatDate(eventDetail.end_date) : undefined}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-800 dark:text-white/90 pb-2">
              Start Time
            </label>
            <input
              type="time"
              name="start_time"
              value={lineup.start_time}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1 bg-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-800 dark:text-white/90 pb-2">
              End Time
            </label>
            <input
              type="time"
              name="end_time"
              value={lineup.end_time}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1 bg-input"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={submitLoading}
          >
            {submitLoading
              ? "Saving..."
              : lineupId
              ? "Save Changes"
              : "Add Line Up"}
          </Button>
        </div>
      </div>
    </div>
  );
}
