import { useState } from 'react';
import {
    useDashboardStats,
    useRevenueChart,
    useLowStockProducts,
    useRecentOrders,
} from '@/hooks/useAdmin';
import { formatOrderCurrency } from '@/lib/pricing';
import {
    DollarSign,
    ShoppingCart,
    Users,
    AlertTriangle,
    Package,
    RefreshCw,
    Loader2,
    TrendingUp,
    ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

interface AdminDashboardProps {
    onNavigate?: (tab: string) => void;
}

const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
    const [chartDays, setChartDays] = useState<7 | 30>(30);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
    const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenueChart(chartDays);
    const { data: lowStockProducts, refetch: refetchLowStock } = useLowStockProducts();
    const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useRecentOrders(6);

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([refetchStats(), refetchRevenue(), refetchLowStock(), refetchOrders()]);
        setIsRefreshing(false);
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        processing: 'bg-indigo-100 text-indigo-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    return (
        <div className="space-y-6">
            {/* Overview section */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                <button
                    onClick={handleRefreshAll}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-white"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Today's Orders", value: stats?.todayOrders || 0, icon: ShoppingCart, color: 'bg-blue-500', loading: statsLoading },
                    { label: "Today's Revenue (₹)", value: `₹${(stats?.todayRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'bg-emerald-500', loading: statsLoading },
                    { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-violet-500', loading: statsLoading },
                    { label: 'Low Stock', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'bg-amber-500', loading: statsLoading },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`${stat.color} p-2 rounded-lg`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        {stat.loading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Revenue chart + Recent Orders — two columns on desktop */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                {/* Revenue chart */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Total Income</h3>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setChartDays(7)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartDays === 7 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            >
                                7 Days
                            </button>
                            <button
                                onClick={() => setChartDays(30)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartDays === 30 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            >
                                30 Days
                            </button>
                        </div>
                    </div>
                    <div className="px-2 pb-4">
                        {revenueLoading ? (
                            <div className="h-[260px] flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                            </div>
                        ) : revenueData && revenueData.length > 0 ? (
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData} barSize={chartDays === 30 ? 8 : 20}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}
                                            formatter={(value: number) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Revenue (INR)']}
                                            cursor={{ fill: '#f9fafb' }}
                                        />
                                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[260px] flex flex-col items-center justify-center text-gray-400">
                                <TrendingUp className="h-8 w-8 mb-2" />
                                <p className="text-sm">No revenue data yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                        <button
                            onClick={() => onNavigate?.('orders')}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            View All <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="px-3 pb-3">
                        {ordersLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                            </div>
                        ) : recentOrders && recentOrders.length > 0 ? (
                            <div className="space-y-1">
                                {recentOrders.map((order) => (
                                    <button
                                        key={order.id}
                                        onClick={() => onNavigate?.('orders')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {order.shipping_name || 'Guest'}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                #{order.order_number || order.id.slice(0, 8)} · {format(new Date(order.created_at), 'MMM d')}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatOrderCurrency(order.currency, order.total)}
                                            </p>
                                            <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${statusColors[order.status || 'pending'] || 'bg-gray-100 text-gray-600'}`}>
                                                {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-8">No orders yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Low Stock section — only show if there are items */}
            {lowStockProducts && lowStockProducts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Low Stock Alert
                        </h3>
                        <button
                            onClick={() => onNavigate?.('products')}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            Manage <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="px-5 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {lowStockProducts.slice(0, 6).map((product) => (
                                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="h-4 w-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-[11px] text-red-500 font-medium">{product.stock_quantity} left</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
