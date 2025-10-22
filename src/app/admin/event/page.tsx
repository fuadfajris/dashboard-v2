"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import DynamicTable from "@/components/commons/DynamicTable"; // path sesuai tempat DynamicTable
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

type Event = {
  id: number;
  merchant_id: number;
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  status: boolean;
  image_venue?: string | null;
  template_id?: number | null;
  hero_image?: string | null;
};

export default function EventPage() {
  const { user, token } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);

  const fetchEvents = async (pageNumber = 1, perPageParam?: number) => {
    const pageSizeToUse = perPageParam ?? pageSize;

    if (!user && !token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events?merchantId=${user?.merchant_id}&page=${pageNumber}&perPage=${pageSizeToUse}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch events");

      const result = await res.json();
      setEvents(result.data || []);
      setPage(result.page || 1);
      setTotalPages(result.totalPages || 1);
      setTotalData(result.total || result.data?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Event - MyApp";
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Columns untuk DynamicTable
  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        header: "No",
        cell: (info) => {
          const rowIndex = info.row.index;
          return rowIndex + 1 + (page - 1) * perPage;
        },
        size: 60,
      },
      {
        accessorKey: "name",
        header: "Event Name",
        cell: (info) => info.getValue(),
        size: 200,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => info.getValue() || "-",
        size: 400,
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: (info) => info.getValue() || "-",
        size: 200,
      },
      {
        accessorKey: "start_date",
        header: "Start Date",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as string).toLocaleDateString()
            : "-",
        size: 120,
      },
      {
        accessorKey: "end_date",
        header: "End Date",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as string).toLocaleDateString()
            : "-",
        size: 120,
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
        cell: (info) => info.getValue() || "-",
        size: 80,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => (info.getValue() ? "Active" : "Inactive"),
        size: 80,
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => console.log("row : ", row.original)}
            >
              Visit
            </button>
            <button
              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() =>
                router.push(`/admin/event/${row.original.id}/detail`)
              }
            >
              Detail
            </button>
          </div>
        ),
        size: 150,
      },
    ],
    []
  );

  return (
    <div className="p-6">
      {/* Header dengan Add Event */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          List Event
        </h1>
        {user?.role.toLowerCase() === "maker" && (
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => router.push("/admin/form/event")}
          >
            Add Event
          </button>
        )}
      </div>

      <DynamicTable<Event>
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
      />
    </div>
  );
}
