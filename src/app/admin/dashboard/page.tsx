"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { BoxIcon, TicketsIcon } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import MonthlySalesChart from "@/components/commons/MonthlySales";

interface EventItem {
  id: number;
  name: string;
}

interface TicketDetail {
  gender?: string;
  event_date: string;
}

interface Ticket {
  ticket_type: string;
  price: string;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

interface OrderTransaction {
  id: number;
  order_date: string;
  status: string;
  quantity: number;
  price: string;
  ticket: Ticket;
  ticket_details: TicketDetail[];
  user: UserInfo;
}

interface Checkin {
  id: number;
  checked_in_at: string;
  ticket_detail: {
    id: number;
    gender: string;
    name: string;
    order: { id: number; event_id: number };
  };
}

interface DashboardStats {
  totalOrders: number;
  totalTickets: number;
  genderStats: { male: number; female: number };
  totalCheckin: number;
  notCheckedIn: number;
  monthlySales: { month: string; total: number }[];
  ticketTypeStats: { type: string; total: number }[];
  recentOrders: OrderTransaction[];
}

export default function DashboardPage() {
  const { user, token } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /** Fetch daftar event */
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.merchant_id || !token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events?merchantId=${user.merchant_id}&page=1&perPage=0`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  /** Fetch dashboard */
  useEffect(() => {
    if (!selectedEventId || !token) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Ambil order transactions
        const [orderRes, checkinRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/order-transactions?event_id=${selectedEventId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/checkins/all-checkins?event_id=${selectedEventId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        const orders: OrderTransaction[] = await orderRes.json();
        const checkins: Checkin[] = await checkinRes.json();

        processDashboardData(orders, checkins);
      } catch (err) {
        console.error("Error fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedEventId, token]);

  /** Olah data dashboard */
  const processDashboardData = (
    orders: OrderTransaction[],
    checkins: Checkin[]
  ) => {
    const totalOrders = orders.length;
    const totalTickets = orders.reduce((sum, o) => sum + o.quantity, 0);

    // Hitung total checkin & gender stats dari API checkins
    const genderStats = { male: 0, female: 0 };
    checkins.forEach((c) => {
      const g = c.ticket_detail.gender?.toLowerCase();
      if (g?.includes("male") || g?.includes("laki")) genderStats.male++;
      else if (g?.includes("female") || g?.includes("perempuan"))
        genderStats.female++;
    });
    const totalCheckin = checkins.length;
    const notCheckedIn = totalTickets - totalCheckin;

    // Monthly sales
    const monthlySalesMap: Record<string, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.order_date);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      monthlySalesMap[month] =
        (monthlySalesMap[month] || 0) + Number(o.price ?? 0);
    });
    const monthlySales = Object.entries(monthlySalesMap).map(
      ([month, total]) => ({ month, total })
    );

    // Ticket type
    const typeMap: Record<string, number> = {};
    orders.forEach((o) => {
      const type = o.ticket?.ticket_type || "Unknown";
      typeMap[type] = (typeMap[type] || 0) + o.quantity;
    });
    const ticketTypeStats = Object.entries(typeMap).map(([type, total]) => ({
      type,
      total,
    }));

    // Recent orders
    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      )
      .slice(0, 5);

    setDashboard({
      totalOrders,
      totalTickets,
      genderStats,
      totalCheckin,
      notCheckedIn,
      monthlySales,
      ticketTypeStats,
      recentOrders,
    });
  };

  /** Monthly sales per year */
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, "0");
    return `${selectedYear}-${month}`;
  });

  const salesChart = allMonths.map((month) => {
    const found = dashboard?.monthlySales.find((d) => d.month === month);
    return found ? found.total : 0;
  });

  const categories = allMonths.map((m) => {
    const [year, month] = m.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("en-US", { month: "short" });
  });

  const availableYears = Array.from(
    new Set(
      dashboard?.monthlySales.map((d) => Number(d.month.split("-")[0])) || []
    )
  ).sort((a, b) => b - a);

  const series = [
    dashboard ? dashboard.genderStats.male : 0,
    dashboard ? dashboard.genderStats.female : 0,
    dashboard ? dashboard.notCheckedIn : 0,
  ];

  const options: ApexOptions = {
    labels: ["Male", "Female", "Not Checkin"],
    colors: ["#3b82f6", "#ec4899", "#999999"],
    legend: { position: "bottom", horizontalAlign: "center", fontSize: "14px" },
  };

  const ticketTypeSeries = dashboard
    ? dashboard.ticketTypeStats.map((t) => t.total)
    : [];
  const ticketTypeLabels = dashboard
    ? dashboard.ticketTypeStats.map((t) => t.type)
    : [];

  const ticketTypeOptions: ApexOptions = {
    labels: ticketTypeLabels,
    legend: { position: "bottom", horizontalAlign: "center", fontSize: "14px" },
  };

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
        <p>Loading dashboard...</p>
      ) : !dashboard ? (
        <p>Please select an event to see dashboard.</p>
      ) : (
        <>
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7 flex flex-col justify-between">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
                {/* Order count */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
                  </div>
                  <div className="mt-5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total Orders
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {dashboard.totalOrders}
                    </h4>
                  </div>
                </div>

                {/* Total Tickets */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <TicketsIcon className="text-gray-800 size-6 dark:text-white/90" />
                  </div>
                  <div className="mt-5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total Tickets Sold
                    </span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                      {dashboard.totalTickets}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Monthly sales */}
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <MonthlySalesChart
                  salesChart={salesChart}
                  categories={categories}
                  selectedYear={selectedYear}
                  availableYears={availableYears}
                  onYearChange={(year) => setSelectedYear(year)}
                />
              </div>
            </div>

            {/* Checkin chart */}
            <div className="col-span-12 xl:col-span-5">
              <div className="rounded-2xl border border-gray-200 h-full bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white/90">
                  Check-in by Gender
                </h3>
                <ReactApexChart
                  options={options}
                  series={series}
                  type="donut"
                  height={250}
                />
                <div className="mt-6 text-center text-sm text-gray-500">
                  Congratulations! There are{" "}
                  {dashboard.totalTickets - dashboard.notCheckedIn} attendees
                  who have already checked in from {dashboard.totalTickets}{" "}
                  ticket. Keep up the great work!
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ticket Type */}
            <div className="rounded-2xl border border-gray-200 p-4 lg:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Ticket Type
              </h3>
              <ReactApexChart
                options={ticketTypeOptions}
                series={ticketTypeSeries}
                type="donut"
                height={250}
              />
            </div>

            {/* Recent Order */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-4 lg:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Recent Order
              </h3>
              <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Ticket</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-2">{o.user.name}</td>
                      <td className="p-2">{o.ticket.ticket_type}</td>
                      <td className="p-2">{o.quantity}</td>
                      <td className="p-2">
                        {new Date(o.order_date).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
