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
  const { user, token } = useUser();
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || !eventId) return;

    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events/detail?eventId=${eventId}&merchantId=${user.merchant_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        setEvent(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [token, user?.merchant_id, eventId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!event) return <div className="p-6 text-center">Event not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/event")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={() =>
              router.push(`/admin/form/event?eventId=${event.id}`)
            }
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* ✅ Komponen Reusable */}
      <EventFormDetail mode="detail" event={event} />
      {/* <EventFormDetail
        mode="activity"
        prevValue={activity.prevValue}
        newValue={activity.newValue}
      /> */}
    </div>
  );
}
