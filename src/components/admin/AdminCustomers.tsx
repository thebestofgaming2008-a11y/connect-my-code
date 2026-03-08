import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomers, Customer } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatOrderCurrency } from '@/lib/pricing';
import { Search, RefreshCw, Loader2, User, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';

const AdminCustomers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const { data: customers = [], isLoading, refetch } = useCustomers();

    // Fetch customer orders when viewing details
    const { data: customerOrders, isLoading: ordersLoading } = useQuery({
        queryKey: ['customer-orders', selectedCustomer?.user_id],
        queryFn: async () => {
            if (!selectedCustomer?.user_id) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', selectedCustomer.user_id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!selectedCustomer?.user_id,
    });

    // Filter customers
    const filteredCustomers = customers.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            customer.full_name?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower) ||
            customer.phone?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Customers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>{filteredCustomers.length} customer(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No customers found</p>
                    ) : (
                        <>
                          {/* Mobile: card layout */}
                          <div className="md:hidden space-y-2">
                            {filteredCustomers.map((customer) => (
                              <div key={customer.id} className="border rounded-lg p-3 bg-background" onClick={() => setSelectedCustomer(customer)}>
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{customer.full_name || 'N/A'}</p>
                                  <span className="text-xs text-muted-foreground">{customer.orders_count || 0} orders</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{customer.email || 'N/A'}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">{format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
                                  <span className="text-sm font-medium">₹{(customer.total_spent || 0).toFixed(0)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop: table layout */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-center">Orders</TableHead>
                                    <TableHead className="text-right">Total Spent (₹)</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            {customer.full_name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{customer.email || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{customer.phone || '-'}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {customer.orders_count || 0}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{(customer.total_spent || 0).toFixed(0)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(customer.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCustomer(customer)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Customer Details Dialog */}
            <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {selectedCustomer?.full_name || 'Customer'}
                        </DialogTitle>
                        <DialogDescription>
                            Customer since {selectedCustomer && format(new Date(selectedCustomer.created_at), 'MMMM d, yyyy')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedCustomer.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedCustomer.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">
                                            {[(selectedCustomer as any).city, (selectedCustomer as any).country].filter(Boolean).join(', ') || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-3">
                                            <ShoppingBag className="h-8 w-8 text-primary" />
                                            <div>
                                                <p className="text-2xl font-bold">{selectedCustomer.orders_count || 0}</p>
                                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-green-600 font-bold">$</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">${(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                                                <p className="text-sm text-muted-foreground">Total Spent</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Orders History */}
                            <div>
                                <h4 className="font-medium mb-3">Order History</h4>
                                {ordersLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : customerOrders && customerOrders.length > 0 ? (
                                    <div className="space-y-2">
                                        {customerOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {order.order_number || order.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        {formatOrderCurrency(order.currency, order.total)}
                                                    </p>
                                                    <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-4">No orders yet</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCustomers;
