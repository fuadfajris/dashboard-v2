"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { ChevronDownIcon, MusicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/commons/Spinner";
import { useRouter } from "next/navigation";

type Event = {
  id: number;
  name: string;
};

type Guest = {
  id: number;
  name: string;
  category: string;
  image?: string;
};

type LineUp = {
  id: number;
  event_id: number;
  guest_id: number;
  stage: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  guest: Guest;
};

export default function LineupPage() {
  const { user, token } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);
  const [lineups, setLineups] = useState<LineUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Line Up - MyApp";
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events?merchantId=${user?.merchant_id}&page=1&perPage=0`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        const eventsData = Array.isArray(data) ? data : data.data || [];
        setEvents(eventsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [user, token]);

  // Fetch lineups ketika event berubah
  useEffect(() => {
    const fetchLineups = async () => {
      if (!token || !eventId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${eventId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch lineups");
        const data: LineUp[] = await res.json();
        setLineups(data || []);
        if (data.length > 0) setActiveDate(data[0].schedule_date);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLineups();
  }, [eventId, token]);

  const uniqueDates = Array.from(new Set(lineups.map((l) => l.schedule_date)));
  const filteredLineups = lineups.filter((l) => l.schedule_date === activeDate);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white/90">
        <MusicIcon className="w-6 h-6 text-primary" /> Line Up Management
      </h1>

      {/* Select Event */}
      <div className="relative w-full md:w-1/2">
        <label className="text-sm text-gray-800 dark:text-white/90">
          Select Event
        </label>
        <select
          className="w-full mt-1 rounded-md border border-gray-300 p-2 appearance-none pr-8 focus:ring-2 focus:ring-primary bg-input"
          value={eventId || ""}
          onChange={(e) => setEventId(Number(e.target.value))}
        >
          <option value="" className="!text-gray-800">
            -- Select Event --
          </option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id} className="!text-gray-800">
              {ev.name}
            </option>
          ))}
        </select>
        <span className="absolute text-gray-500 pointer-events-none right-3 top-[42px]">
          <ChevronDownIcon />
        </span>
      </div>

      {/* Tabs tanggal + Add Button */}
      {uniqueDates.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {uniqueDates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`px-4 py-2 rounded-md ${
                  date === activeDate
                    ? "bg-blue-600 text-white/90"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 border border-gray-300"
                }`}
              >
                {new Date(date).toLocaleDateString("id-ID")}
              </button>
            ))}
          </div>
          <div>
            {user?.role.toLowerCase() === "maker" && (
              <Button
                onClick={() =>
                  router.push(`/admin/form/lineup?eventId=${eventId}`)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={!eventId}
              >
                + Add Line Up
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table Line Up */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center">
            <Spinner className="w-6 h-6 mx-auto" />
            <p className="text-gray-500 mt-2">Loading lineups...</p>
          </div>
        ) : !eventId ? (
          <div className="text-gray-500 text-center py-8">
            🎫 Please select an event first
          </div>
        ) : filteredLineups.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No lineups found for this date.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Artist</th>
                  <th className="p-3 text-left">Genre</th>
                  <th className="p-3 text-left">Stage</th>
                  <th className="p-3 text-left">Start Time</th>
                  <th className="p-3 text-left">End Time</th>
                  {user?.role.toLowerCase() === "maker" && (
                    <th className="p-3 stext-left">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLineups.map((l) => (
                  <tr
                    key={l.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 flex items-center gap-2">
                      {l.guest?.name || "-"}
                    </td>
                    <td className="p-3">{l.guest?.category || "-"}</td>
                    <td className="p-3">{l.stage}</td>
                    <td className="p-3">{l.start_time}</td>
                    <td className="p-3">{l.end_time}</td>
                    {user?.role.toLowerCase() === "maker" && (
                      <td className="p-3 flex gap-2">
                        <button
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() =>
                            router.push(`/admin/lineup/${l.id}/detail`)
                          }
                        >
                          Detail
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <br />
      {/* <DynamicTable<LineUp>
        columns={columns}
        data={events}
        isLoading={loading}
        pagination={{ pageIndex: page - 1, pageSize }}
        setPagination={(p) => {
          let newPageIndex =
            typeof p === "function"
              ? p({ pageIndex: page - 1, pageSize }).pageIndex
              : p.pageIndex;

          let newPageSize =
            typeof p === "function"
              ? p({ pageIndex: page - 1, pageSize }).pageSize
              : p.pageSize;

          setPage(newPageIndex + 1);
          setPageSize(newPageSize);
          fetchEvents(newPageIndex + 1, newPageSize);
        }}
        totalData={totalData}
      /> */}
    </div>
  );
}
