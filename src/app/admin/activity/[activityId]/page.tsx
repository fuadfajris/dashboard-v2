"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Spinner from "@/components/commons/Spinner";
import { Badge } from "@/components/ui/badge";

type ActivityContent = {
  contentKey: string;
  prevValue: any;
  newValue: any;
};

type Maker = {
  id: number;
  name: string;
  email?: string;
  logo?: string | null;
  merchant_id?: number;
  role?: string;
};

type Activity = {
  id: number;
  merchant_id: number;
  content_key: string;
  content_name: string;
  content: ActivityContent;
  maker: Maker | null;
  approver?: any;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

// Dinamis import untuk form detail
const formDetailMap: Record<string, any> = {
  event: dynamic(() => import("@/components/form/detail/EventFormDetail")),
};

export default function ActivityDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const activityId = params.activityId;
  const { token } = useUser();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId || !token) return;

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/activity/${activityId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch activity");
        const data = await res.json();

        // Parse kolom content
        const parsedContent: ActivityContent = data.content
          ? JSON.parse(data.content)
          : { prevValue: null, newValue: null };

        // Parse kolom maker
        const parsedMaker: Maker | null = data.maker
          ? JSON.parse(data.maker)
          : null;

        setActivity({
          id: data.id,
          merchant_id: data.merchant_id,
          content_key: data.content_key,
          content_name: data.content_name,
          content: parsedContent,
          maker: parsedMaker,
          approver: data.approver,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId, token]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Spinner className="w-8 h-8 mx-auto" />
        <p className="mt-2 text-gray-500">Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-6 text-center text-red-500">❌ Activity not found</div>
    );
  }

  const DetailComponent = formDetailMap[activity.content_key];

  if (!DetailComponent) {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ No detail component found for <b>{activity.content_key}</b>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: "approved" | "rejected") => {
    if (!token || !activity) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/${activity.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            approver: user,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status");
      const updatedActivity = await res.json();

      // Update state local agar UI langsung berubah
      setActivity((prev) =>
        prev
          ? {
              ...prev,
              status: updatedActivity.status,
              approver: updatedActivity.approver,
              updated_at: updatedActivity.updated_at,
            }
          : prev
      );

      if (newStatus === "approved") {
        const templateUrl = `${process.env.NEXT_PUBLIC_API_URL}`;
        const parsedContent =
          typeof activity.content === "string"
            ? JSON.parse(activity.content)
            : activity.content;

        switch (activity.content_key) {
          case "event":
            const isEdit = !!parsedContent.prevValue;
            const url = isEdit
              ? `${templateUrl}/events/${
                  parsedContent.newValue.id || parsedContent.prevValue.id
                }`
              : `${templateUrl}/events`;
            const method = isEdit ? "PUT" : "POST";
            
            await fetch(`${url}`, {
              method: method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(activity.content.newValue),
            });
            break;
          default:
            break;
        }
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status activity");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Activity Detail #{activityId}{" "}
          <Badge className="bg-green-500">{activity.status}</Badge>
        </h1>

        <div className="flex space-x-4">
          {/* Action Buttons */}
          {activity.status.toLowerCase() === "pending" && (
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
                onClick={() => handleStatusChange("approved")}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => handleStatusChange("rejected")}
              >
                Reject
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => router.push("/admin/activity")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      {/* Dynamic detail */}
      <DetailComponent
        mode="activity"
        prevValue={activity.content.prevValue}
        newValue={activity.content.newValue}
      />

      {/* Info Maker & Approver */}
      <div className="bg-white rounded-lg border p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-600">Created by</span>
            <p className="font-medium text-sm">
              {activity.maker?.name || "Unknown User"}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Date</span>
            <p className="font-medium text-sm">
              {new Date(activity.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {activity.approver && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">Approved by</span>
              <p className="font-medium text-sm">
                {activity.approver?.name || "Unknown User"}
              </p>
            </div>
            {activity.updated_at && (
              <div>
                <span className="text-sm text-gray-600">Approved at</span>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {new Date(activity.updated_at).toLocaleDateString("id-ID")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
