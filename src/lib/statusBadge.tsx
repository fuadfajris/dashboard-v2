// src/utils/statusBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status?: string) => {
  const base =
    "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full text-center w-full"; // gunakan min-w agar fleksibel

  switch (status?.toLowerCase()) {
    case "success":
    case "active":
    case "approved":
      return (
        <Badge className={`${base} bg-green-500 text-white`}>{status}</Badge>
      );
    case "failed":
    case "error":
    case "rejected":
      return (
        <Badge className={`${base} bg-red-500 text-white`}>{status}</Badge>
      );
    case "pending":
      return (
        <Badge className={`${base} bg-yellow-500 text-white`}>{status}</Badge>
      );
    default:
      return (
        <Badge className={`${base} bg-gray-500 text-white`}>
          {status || "Unknown"}
        </Badge>
      );
  }
};
