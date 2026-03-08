import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAdminOrders, useOrderDetails, useUpdateOrder, AdminOrder } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { formatOrderCurrency } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
    Search,
    RefreshCw,
    Loader2,
    Clock,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    User,
    MapPin,
    Phone,
    Mail,
    AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
    processing: { label: 'Processing', icon: Package, color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
};

const DANGEROUS_STATUSES = new Set(['cancelled']);

const AdminOrders = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; orderNumber: string; newStatus: string } | null>(null);

    const { data: orders = [], isLoading, refetch } = useAdminOrders(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
    );
    const { data: orderDetails, isLoading: detailsLoading } = useOrderDetails(selectedOrderId || '');
    const updateOrder = useUpdateOrder();

    const filteredOrders = orders.filter((order) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            order.order_number?.toLowerCase().includes(searchLower) ||
            order.shipping_name?.toLowerCase().includes(searchLower) ||
            order.shipping_email?.toLowerCase().includes(searchLower) ||
            order.id.toLowerCase().includes(searchLower)
        );
    });

    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
        const s = o.status || 'pending';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const getStatusBadge = (status: string | null) => {
        const cfg = STATUS_CONFIG[status || 'pending'] || STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bgColor} ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
            </span>
        );
    };


    const requestStatusUpdate = (orderId: string, orderNumber: string, newStatus: string) => {
        if (DANGEROUS_STATUSES.has(newStatus)) {
            setPendingStatusChange({ orderId, orderNumber, newStatus });
        } else {
            executeStatusUpdate(orderId, newStatus);
        }
    };

    const executeStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await updateOrder.mutateAsync({
                id: orderId,
                updates: { status: newStatus as AdminOrder['status'] },
            });
            toast({ title: 'Status Updated', description: `Order status changed to ${newStatus}` });

            // Auto-trigger email on status change
            if (newStatus === 'confirmed' || newStatus === 'shipped') {
                const emailType = newStatus === 'shipped' ? 'tracking_update' : 'confirmation';
                try {
                    await supabase.functions.invoke('send-order-email', {
                        body: { order_id: orderId, email_type: emailType },
                    });
                } catch {
                    // Non-blocking: don't fail the status update if email fails
                }
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
        }
        setPendingStatusChange(null);
    };

    const handleTrackingUpdate = async (orderId: string, trackingNumber: string, trackingCarrier: string) => {
        try {
            await updateOrder.mutateAsync({
                id: orderId,
                updates: { tracking_number: trackingNumber, tracking_carrier: trackingCarrier },
            });
            toast({ title: 'Tracking Updated' });
            if (trackingNumber) {
                try {
                    const { supabase } = await import('@/integrations/supabase/client');
                    await supabase.functions.invoke('send-order-email', {
                        body: { order_id: orderId, email_type: 'tracking_update' },
                    });
                    toast({ title: 'Tracking email sent to customer' });
                } catch {
                    // Non-critical — tracking is saved even if email fails
                }
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update tracking', variant: 'destructive' });
        }
    };

    const handleNotesUpdate = async (orderId: string, notes: string) => {
        try {
            await updateOrder.mutateAsync({
                id: orderId,
                updates: { admin_notes: notes },
            });
            toast({ title: 'Notes Saved' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save notes. Ensure the admin_notes column exists in the orders table.', variant: 'destructive' });
        }
    };

    const statusTabs = [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div className="space-y-5">
            {/* Search + Refresh */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, order #, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 bg-white border-gray-200"
                    />
                </div>
                <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {statusTabs.map(tab => {
                    const count = tab.value === 'all' ? orders.length : (statusCounts[tab.value] || 0);
                    const isActive = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Orders list */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No orders found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
                            <button
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                className="w-full flex items-center gap-3 md:gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left"
                            >
                                {/* Order info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {order.shipping_name || 'Guest'}
                                        </span>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        #{order.order_number || order.id.slice(0, 8)} · {format(new Date(order.created_at), 'MMM d, yyyy')}
                                        {order.shipping_email && <span className="hidden sm:inline"> · {order.shipping_email}</span>}
                                    </p>
                                </div>

                                {/* Total */}
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-gray-900">
                                        {formatOrderCurrency(order.currency, order.total)}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        {order.payment_status === 'paid' ? 'Paid' : order.payment_method === 'whatsapp' ? 'WhatsApp' : 'Razorpay'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Dangerous status change confirmation */}
            <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open) setPendingStatusChange(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cancel Order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark order <strong className="text-foreground">#{pendingStatusChange?.orderNumber}</strong> as <strong className="text-red-600">cancelled</strong>? This may affect the customer and cannot be easily reversed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                                if (pendingStatusChange) executeStatusUpdate(pendingStatusChange.orderId, pendingStatusChange.newStatus);
                            }}
                        >
                            Yes, Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Order Details Dialog */}
            <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Order #{orderDetails?.order?.order_number || selectedOrderId?.slice(0, 8)}
                        </DialogTitle>
                        <DialogDescription>
                            {orderDetails?.order && format(new Date(orderDetails.order.created_at), 'MMMM d, yyyy h:mm a')}
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : orderDetails?.order ? (
                        <div className="space-y-5">
                            {/* Status selector with confirmation for dangerous changes */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Status</span>
                                    {getStatusBadge(orderDetails.order.status)}
                                </div>
                                <Select
                                    value={orderDetails.order.status || 'pending'}
                                    onValueChange={(value) => requestStatusUpdate(
                                        orderDetails.order.id,
                                        orderDetails.order.order_number || orderDetails.order.id.slice(0, 8),
                                        value
                                    )}
                                >
                                    <SelectTrigger className="w-36 h-8 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">
                                            <span className="text-red-600">Cancelled</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Customer Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    Customer
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Name</p>
                                        <p className="font-medium text-gray-900">{orderDetails.order.shipping_name}</p>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                                        <p className="text-gray-700 break-all">{orderDetails.order.shipping_email}</p>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
                                        <p className="text-gray-700">{orderDetails.order.shipping_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Shipping Address */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    Shipping Address
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {orderDetails.order.shipping_address_line_1}<br />
                                    {orderDetails.order.shipping_city}, {orderDetails.order.shipping_state} {orderDetails.order.shipping_postal_code}<br />
                                    {orderDetails.order.shipping_country}
                                </p>
                            </div>

                            <Separator />

                            {/* Order Items */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    Items ({orderDetails.items.length})
                                </h4>
                                <div className="space-y-2">
                                    {orderDetails.items.map((item) => {
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                                {item.product_image && (
                                                    <img src={item.product_image} alt={item.product_name} className="w-11 h-11 rounded-lg object-cover border border-gray-100" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatOrderCurrency(item.currency, item.unit_price)}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatOrderCurrency(item.currency, item.total_price || item.unit_price * item.quantity)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            {/* Order Summary */}
                            <div className="space-y-2 text-sm p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-700">{formatOrderCurrency(orderDetails.order.currency, orderDetails.order.subtotal)}</span>
                                    </div>
                                    {Number(orderDetails.order.shipping_cost) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Shipping</span>
                                            <span className="text-gray-700">{formatOrderCurrency(orderDetails.order.currency, orderDetails.order.shipping_cost)}</span>
                                        </div>
                                    )}
                                    {Number(orderDetails.order.discount) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-{formatOrderCurrency(orderDetails.order.currency, orderDetails.order.discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">{formatOrderCurrency(orderDetails.order.currency, orderDetails.order.total)}</span>
                                    </div>
                                </>
                            </div>

                            <Separator />

                            {/* Tracking Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-gray-400" />
                                    Tracking
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tracking_carrier" className="text-xs">Carrier</Label>
                                        <Input
                                            id="tracking_carrier"
                                            defaultValue={orderDetails.order.tracking_carrier || ''}
                                            placeholder="e.g., BlueDart, DTDC"
                                            className="h-9"
                                            onBlur={(e) => {
                                                if (e.target.value !== orderDetails.order.tracking_carrier) {
                                                    handleTrackingUpdate(
                                                        orderDetails.order.id,
                                                        orderDetails.order.tracking_number || '',
                                                        e.target.value
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tracking_number" className="text-xs">Tracking Number</Label>
                                        <Input
                                            id="tracking_number"
                                            defaultValue={orderDetails.order.tracking_number || ''}
                                            placeholder="Tracking number"
                                            className="h-9"
                                            onBlur={(e) => {
                                                if (e.target.value !== orderDetails.order.tracking_number) {
                                                    handleTrackingUpdate(
                                                        orderDetails.order.id,
                                                        e.target.value,
                                                        orderDetails.order.tracking_carrier || ''
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="admin_notes" className="text-xs">Internal Notes</Label>
                                <Textarea
                                    id="admin_notes"
                                    key={orderDetails.order.id}
                                    defaultValue={orderDetails.order.admin_notes || ''}
                                    placeholder="Private notes about this order..."
                                    rows={2}
                                    className="text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updateOrder.isPending}
                                    onClick={() => {
                                        const el = document.getElementById('admin_notes') as HTMLTextAreaElement;
                                        if (el) handleNotesUpdate(orderDetails.order.id, el.value);
                                    }}
                                >
                                    {updateOrder.isPending ? (
                                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Saving...</>
                                    ) : 'Save Notes'}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminOrders;
