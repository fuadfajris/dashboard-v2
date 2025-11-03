"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LineupFormDetail, {
  LineUpData,
} from "@/components/form/detail/LineupFormDetail";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

export default function LineupDetailPage() {
  const { user, token } = useUser();
  const params = useParams();
  const router = useRouter();
  const lineupId = params.lineupId;

  const [lineup, setLineup] = useState<LineUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!lineupId || !token) return;

    const fetchLineup = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/guests/lineup/${lineupId}/detail`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const lineupData: LineUpData = {
          id: Number(data.id),
          event_id: Number(data.event_id),
          guest_id: Number(data.guest_id),
          stage: data.stage,
          schedule_date: data.schedule_date,
          start_time: data.start_time,
          end_time: data.end_time,
          guest: {
            id: Number(data.guest.id),
            name: data.guest.name,
            category: data.guest.category,
            image: data.guest.image,
          },
        };
        setLineup(lineupData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch lineup detail");
      } finally {
        setLoading(false);
      }
    };

    fetchLineup();
  }, [lineupId, token]);

  // ✅ Cek pending
  useEffect(() => {
    if (!lineup) return;
    const checkPending = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/activity/check-pending?id=${lineup.id}&merchantId=${user?.merchant_id}&contentKey=lineup`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to check pending");
        const data = await res.json();
        setHasPending(data.pending);
      } catch (err) {
        console.error(err);
        setHasPending(false);
      }
    };
    checkPending();
  }, [lineup, token, user?.merchant_id]);

  const handleDelete = async () => {
    if (!lineup) return;
    if (!confirm(`Delete lineup ${lineup.guest?.name}?`)) return;
    if (!token) return;

    try {
      const activityRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content_key: "lineup",
            content_name: "Delete Line Up",
            maker: user,
            prevValue: lineup,
            newValue: null,
          }),
        }
      );

      if (!activityRes.ok) throw new Error("Failed to log activity");

      alert("Activity logged. Lineup deleted.");
      router.push("/admin/lineup");
    } catch (err) {
      console.error(err);
      alert("Gagal mencatat activity");
    }
  };

  if (loading) return <p>Loading lineup detail...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!lineup) return <p>No lineup data found</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold mb-4">Lineup Detail</h2>

        <div className="flex gap-2">
          <Button
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
            onClick={() => router.push("/admin/lineup")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {user?.role.toLowerCase() === "maker" && !hasPending && (
            <>
              <Button
                className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90"
                onClick={() =>
                  router.push(
                    `/admin/form/lineup?eventId=${lineup.event_id}&lineupId=${lineup.id}`
                  )
                }
                disabled={hasPending} // ❌ disable jika pending
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>

              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={handleDelete}
                disabled={hasPending} // ❌ disable jika pending
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <LineupFormDetail mode="detail" newValue={lineup} />
    </div>
  );
}
