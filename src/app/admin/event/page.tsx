"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import DynamicTable from "@/components/commons/DynamicTable";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { getStatusBadge } from "@/lib/statusBadge";

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

type Template = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features: string[];
};

type RawTemplate = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  description: string | null;
  url: string | null;
  features?: { feature_name: string }[];
};

export default function EventPage() {
  const { user, token, logout } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // ✨ Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page saat search berubah
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch templates dari API
  const fetchTemplates = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch templates:", res.status, res.statusText);
        return;
      }

      const result = await res.json();
      const data: RawTemplate[] = result.data || [];
      const mapped: Template[] = data.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        thumbnail: t.thumbnail,
        description: t.description,
        url: t.url,
        features: t.features ? t.features.map((f) => f.feature_name) : [],
      }));

      setTemplates(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch events dengan pagination dan search
  const fetchEvents = async (pageNumber = 1, perPageParam?: number) => {
    if (!user || !token) return;
    const perPage = perPageParam ?? pageSize;

    setLoading(true);
    try {
      const query = new URLSearchParams({
        merchantId: String(user.merchant_id),
        page: String(pageNumber),
        perPage: String(perPage),
      });
      if (debouncedSearch) query.append("search", debouncedSearch);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        logout();
        return;
      }

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
    fetchTemplates();
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [user, debouncedSearch]);

  // Kolom untuk DynamicTable
  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        header: "No",
        cell: (info) => info.row.index + 1 + (page - 1) * pageSize,
        size: 60,
      },
      { accessorKey: "name", header: "Event Name", size: 200 },
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
        cell: (info) => getStatusBadge(info.getValue() ? "Active" : "Inactive"),
        size: 80,
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const evt = row.original;
          const template = templates.find((t) => t.id === evt.template_id);
          const templateUrl = template?.url || "#";

          return (
            <div className="flex gap-2">
              <a
                href={`${templateUrl}?event_id=${evt.id}&merchant_id=${evt.merchant_id}&edit=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Visit
              </a>
              <button
                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => router.push(`/admin/event/${evt.id}/detail`)}
              >
                Detail
              </button>
            </div>
          );
        },
        size: 150,
      },
    ],
    [page, pageSize, router, templates]
  );

  return (
    <div className="p-6">
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

      {/* Search input */}
      <div className="mb-4">
        <input
          placeholder="Search by event name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border p-2 rounded bg-input"
        />
      </div>

      <DynamicTable<Event>
        columns={columns}
        data={events}
        isLoading={loading}
        pagination={{ pageIndex: page - 1, pageSize }}
        setPagination={(p) => {
          const newPageIndex =
            typeof p === "function"
              ? p({ pageIndex: page - 1, pageSize }).pageIndex
              : p.pageIndex;
          const newPageSize =
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
