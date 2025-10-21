"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

type ActivityContent = {
  contentKey: string;
  prevValue: any;
  newValue: any;
};

// Dinamis import untuk form detail
const formDetailMap: Record<string, any> = {
  event: dynamic(() => import("@/components/form/detail/EventFormDetail")),
  // merchant: dynamic(() => import("@/components/form/detail/MerchantFormDetail")),
};

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.activityId;

  // 💡 Dummy activity
  const activity: ActivityContent = {
    contentKey: "event",
    prevValue: {
      id: "1",
      name: "Test Add Local (Before)",
      location: "Jakarta",
      description: "SDasd Before",
      start_date: "2025-10-30",
      end_date: "2025-10-31",
      capacity: 100,
      status: true,
      template: {
        id: 1,
        title: "Template A",
        category: "Education",
        thumbnail: "/uploads/templates/templateA.png",
        description: "Template description",
      },
      image_venue: "/uploads/event/1760930413671-activity table.png",
      hero_image: null,
    },
    // prevValue: undefined,
    newValue: {
      id: "1",
      name: "Test Add Local",
      location: "Jakarta",
      description: "SDasd",
      start_date: "2025-10-30",
      end_date: "2025-10-31",
      capacity: 100,
      status: true,
      template: {
        id: 1,
        title: "Template A",
        category: "Education",
        thumbnail: "/uploads/templates/templateA.png",
        description: "Template description",
      },
      image_venue: "/uploads/event/1760930413671-activity table.png",
      hero_image: null,
    },
  };

  const DetailComponent = formDetailMap[activity.contentKey];

  if (!DetailComponent) {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ No detail component found for <b>{activity.contentKey}</b>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activity Detail #{activityId}</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/activity")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Dynamic detail */}
      <DetailComponent
        mode="activity"
        prevValue={activity.prevValue}
        newValue={activity.newValue}
      />
    </div>
  );
}
