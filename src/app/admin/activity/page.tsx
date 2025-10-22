"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import DynamicTable from "@/components/commons/DynamicTable";
import { useRouter } from "next/navigation";

interface Activity {
  id: number;
  merchant_id: number;
  content_key: string;
  content_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ActivityPage() {
  const { user, token } = useUser();

  // table states
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [totalData, setTotalData] = useState(0);
  const router = useRouter();

  const fetchData = async () => {
    if (!token || !user) return;

    setIsLoading(true);
    try {
      const page = pagination.pageIndex + 1;
      const perPage = pagination.pageSize;

      // build sort query if exists
      const sortQuery = sorting
        .map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`)
        .join(",");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity?merchantId=${user.merchant_id}&page=${page}&perPage=${perPage}&sort=${sortQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      setData(json.data || []);
      setTotalData(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination, sorting, user, token]);

  const columns: ColumnDef<Activity>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Content Key", accessorKey: "content_key" },
    { header: "Content Name", accessorKey: "content_name" },
    { header: "Status", accessorKey: "status" },
    {
      header: "Created At",
      accessorKey: "created_at",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return `${String(date.getDate()).padStart(2, "0")}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`;
      },
    },
    {
      header: "Updated At",
      accessorKey: "updated_at",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return info.getValue()
          ? `${String(date.getDate()).padStart(2, "0")}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${date.getFullYear()}`
          : "-";
      },
    },
    {
      header: "Action",
      id: "action",
      cell: (info) => (
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push(`/admin/activity/${info.row.original.id}`)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Activity</h1>
      <DynamicTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        totalData={totalData}
        emptyMessage="No activities found"
      />
    </div>
  );
}
