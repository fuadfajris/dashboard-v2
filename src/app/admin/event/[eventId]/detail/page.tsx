"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import EventFormDetail, {
  EventData,
} from "@/components/form/detail/EventFormDetail";

export default function EventDetailPage() {
  const { user, token, isLoading: userLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false); // ✅ pending activity

  useEffect(() => {
    if (!token || !user || !eventId || userLoading) return;

    const fetchEvent = async () => {
      setLoading(true);
      try {
        // 1️⃣ Fetch event detail
        const resEvent = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events/detail?eventId=${eventId}&merchantId=${user.merchant_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!resEvent.ok) throw new Error("Failed to fetch event");
        const data: EventData = await resEvent.json();
        setEvent(data);

        // 2️⃣ Cek pending activity
        const resPending = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/activity/check-pending?id=${eventId}&merchantId=${user.merchant_id}&contentKey=event`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!resPending.ok) throw new Error("Failed to check pending");
        const pendingData = await resPending.json();
        setPending(pendingData.pending);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [token, user?.merchant_id, eventId, userLoading]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!event) return <div className="p-6 text-center">Event not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {event.name}
        </h1>
        <div className="flex gap-2">
          <Button
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
            onClick={() => router.push("/admin/event")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {user?.role.toLowerCase() === "maker" && !pending && (
            <Button
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
              onClick={() =>
                router.push(`/admin/form/event?eventId=${event.id}`)
              }
              disabled={pending} // ✅ disable jika ada pending
              title={pending ? "Cannot edit while pending approval" : ""}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Komponen Reusable */}
      <EventFormDetail mode="detail" event={event} />
    </div>
  );
}
