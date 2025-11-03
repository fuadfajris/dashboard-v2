"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DynamicTable from "@/components/commons/DynamicTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";

type TicketDetail = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  gender: string;
  ticket_status: string;
  event_date: string;
  order: {
    id: number;
    ticket: {
      ticket_type: string;
      price: string;
    };
  };
  checkin?: {
    id: number;
    checked_in_at: string;
  } | null;
};

export default function OrderDetailPage() {
  const { token } = useUser();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<TicketDetail[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ticket-details?order_id=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data: TicketDetail[] = await res.json();
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const columns: ColumnDef<TicketDetail>[] = [
    { header: "#", cell: ({ row }) => row.index + 1 },
    { accessorKey: "name", header: "Nama" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Telepon" },
    { accessorKey: "address", header: "Alamat" },
    { accessorKey: "age", header: "Umur" },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => row.original.gender,
    },
    { accessorKey: "order.ticket.ticket_type", header: "Tipe Tiket" },
    {
      accessorKey: "order.ticket.price",
      header: "Harga",
      cell: ({ row }) =>
        `Rp ${Number(row.original.order.ticket.price).toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "ticket_status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            row.original.ticket_status === "valid"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.ticket_status}
        </span>
      ),
    },
    {
      header: "Check-in",
      cell: ({ row }) =>
        row.original.checkin
          ? new Date(row.original.checkin.checked_in_at).toLocaleDateString(
              "id-ID",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }
            )
          : "-",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white/90">
        🎟️ Order #{id} Details
      </h1>

      <DynamicTable<TicketDetail>
        columns={columns}
        data={details}
        isLoading={loading}
        pagination={pagination}
        setPagination={setPagination}
        totalData={details.length}
        emptyMessage="No ticket details found"
      />
    </div>
  );
}
