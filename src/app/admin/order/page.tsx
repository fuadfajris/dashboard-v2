"use client";

import { useEffect, useState } from "react";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import DynamicTable from "@/components/commons/DynamicTable";
import { Button } from "@/components/ui/button";

interface EventItem {
  id: number;
  name: string;
}

type Order = {
  id: number;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  order_date: string;
  quantity: number;
  price: string;
  status: string;
};

type PaginatedResponse = {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function OrderPage() {
  const { user, token, logout } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalData, setTotalData] = useState(0);
  const [search, setSearch] = useState(""); // state search user input
  const [debouncedSearch, setDebouncedSearch] = useState(search); // state search yang sudah debounce

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.merchant_id || !token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events?merchantId=${user.merchant_id}&page=1&perPage=0`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401) {
          logout();
          return;
        }

        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        setEvents(data);
        if (!selectedEventId && data.length > 0) setSelectedEventId(data[0].id);
      } catch (err) {
        console.error("Error fetch events:", err);
      }
    };
    fetchEvents();
  }, [user, token]);

  // ✨ Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((old) => ({ ...old, pageIndex: 0 })); // reset page ke 0 saat search
    }, 500); // delay 500ms

    return () => clearTimeout(handler); // cleanup tiap search berubah
  }, [search]);

  const fetchOrders = async () => {
    if (!token || !selectedEventId) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        event_id: String(selectedEventId),
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (debouncedSearch) query.append("search", debouncedSearch);

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/order-transactions/order?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data: PaginatedResponse = await res.json();

      setOrders(data.data);
      setTotalData(data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // fetch ketika pagination atau debouncedSearch berubah
  useEffect(() => {
    fetchOrders();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, token, selectedEventId]);

  const columns: ColumnDef<Order>[] = [
    {
      header: "#",
      cell: ({ row }) =>
        row.index + 1 + pagination.pageIndex * pagination.pageSize,
    },
    { accessorKey: "user.name", header: "Customer" },
    { accessorKey: "user.email", header: "Email" },
    { accessorKey: "user.phone", header: "Phone" },
    { accessorKey: "quantity", header: "Qty" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) =>
        `Rp ${Number(row.original.price).toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "order_date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.order_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            row.original.status === "paid"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/order/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
        <div className="w-full md:w-1/2 px-6 py-5">
          <label className="block text-sm font-medium text-gray-800 dark:text-white/90 mb-1">
            Select Event
          </label>
          <select
            value={selectedEventId ?? ""}
            onChange={(e) =>
              setSelectedEventId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-input"
          >
            <option value="" className="!text-gray-800">
              -- Select Event --
            </option>
            {events.map((e) => (
              <option key={e.id} value={e.id} className="!text-gray-800">
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading order...</p>
      ) : !selectedEventId ? (
        <p>Please select an event to see list order.</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
          <div className="px-6 py-5">
            <div className="flex justify-between flex-wrap mb-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                🧾 Order List
              </h1>
              <div className="mb-4">
                <input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-sm border p-2 rounded bg-input"
                />
              </div>
            </div>

            <DynamicTable<Order>
              columns={columns}
              data={orders}
              isLoading={loading}
              pagination={pagination}
              setPagination={setPagination}
              totalData={totalData}
              emptyMessage="No orders found"
            />
          </div>
        </div>
      )}

      {/* <div className="p-6 space-y-4">
        <div className="flex justify-between flex-wrap mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            🧾 Order List
          </h1>
          <div className="mb-4">
            <input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm border p-2 rounded bg-input"
            />
          </div>
        </div>

        <DynamicTable<Order>
          columns={columns}
          data={orders}
          isLoading={loading}
          pagination={pagination}
          setPagination={setPagination}
          totalData={totalData}
          emptyMessage="No orders found"
        />
      </div> */}
    </>
  );
}
