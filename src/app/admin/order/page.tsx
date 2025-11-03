"use client";

import { useEffect, useState } from "react";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import DynamicTable from "@/components/commons/DynamicTable";
import { Button } from "@/components/ui/button";

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
  const { token } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalData, setTotalData] = useState(0);
  const [search, setSearch] = useState(""); // state search user input
  const [debouncedSearch, setDebouncedSearch] = useState(search); // state search yang sudah debounce

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const eventId = 3;

  // ✨ Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((old) => ({ ...old, pageIndex: 0 })); // reset page ke 0 saat search
    }, 500); // delay 500ms

    return () => clearTimeout(handler); // cleanup tiap search berubah
  }, [search]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        event_id: String(eventId),
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
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, token]);

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
    <div className="p-6 space-y-4">
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
  );
}
