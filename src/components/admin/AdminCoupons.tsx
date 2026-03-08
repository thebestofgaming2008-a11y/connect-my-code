import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, AdminCoupon } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Loader2, Tag, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
    code: '',
    description: '',
    discount_type: 'percentage' as AdminCoupon['discount_type'],
    discount_value: 10,
    max_discount_inr: null as number | null,
    max_discount_usd: null as number | null,
    minimum_order_inr: 0,
    minimum_order_usd: 0,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: null as string | null,
    is_active: true,
};

const AdminCoupons = () => {
    const { toast } = useToast();
    const { data: coupons = [], isLoading, refetch } = useAdminCoupons();
    const createCoupon = useCreateCoupon();
    const updateCoupon = useUpdateCoupon();
    const deleteCoupon = useDeleteCoupon();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (coupon: AdminCoupon) => {
        setEditingId(coupon.id);
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            max_discount_inr: coupon.max_discount_inr,
            max_discount_usd: coupon.max_discount_usd,
            minimum_order_inr: coupon.minimum_order_inr,
            minimum_order_usd: coupon.minimum_order_usd,
            valid_from: coupon.valid_from?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            valid_until: coupon.valid_until?.slice(0, 10) || null,
            is_active: coupon.is_active,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim()) {
            toast({ title: 'Error', description: 'Coupon code is required', variant: 'destructive' });
            return;
        }

        const payload = {
            ...form,
            code: form.code.toUpperCase().trim(),
            description: form.description || null,
            valid_from: new Date(form.valid_from).toISOString(),
            valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        };

        try {
            if (editingId) {
                await updateCoupon.mutateAsync({ id: editingId, updates: payload });
                toast({ title: 'Coupon updated' });
            } else {
                await createCoupon.mutateAsync(payload);
                toast({ title: 'Coupon created' });
            }
            setDialogOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save coupon. Check that the coupons table exists.', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCoupon.mutateAsync(id);
            toast({ title: 'Coupon deleted' });
        } catch {
            toast({ title: 'Error', description: 'Failed to delete coupon', variant: 'destructive' });
        }
    };

    const handleToggleActive = async (coupon: AdminCoupon) => {
        try {
            await updateCoupon.mutateAsync({ id: coupon.id, updates: { is_active: !coupon.is_active } });
            toast({ title: coupon.is_active ? 'Coupon deactivated' : 'Coupon activated' });
        } catch {
            toast({ title: 'Error', description: 'Failed to update coupon', variant: 'destructive' });
        }
    };

    const isSaving = createCoupon.isPending || updateCoupon.isPending;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Coupons</h2>
                    <p className="text-sm text-muted-foreground">Create and manage discount codes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Coupon
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />All Coupons</CardTitle>
                    <CardDescription>{coupons.length} coupon(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : coupons.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No coupons yet. Create one to get started.</p>
                    ) : (
                        <>
                          {/* Mobile: card layout */}
                          <div className="md:hidden space-y-2">
                            {coupons.map((coupon) => (
                              <div key={coupon.id} className="border rounded-lg p-3 bg-background space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-sm">{coupon.code}</span>
                                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>{coupon.is_active ? 'Active' : 'Off'}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : coupon.discount_type === 'fixed_inr' ? `₹${coupon.discount_value}` : `$${coupon.discount_value}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {coupon.valid_until ? `Until ${format(new Date(coupon.valid_until), 'MMM d')}` : 'No expiry'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <Switch checked={coupon.is_active} onCheckedChange={() => handleToggleActive(coupon)} />
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                                          <AlertDialogDescription>Delete coupon "{coupon.code}"? This cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(coupon.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop: table layout */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Min Order</TableHead>
                                    <TableHead>Valid</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                                        <TableCell>
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : coupon.discount_type === 'fixed_inr'
                                                    ? `₹${coupon.discount_value}`
                                                    : `$${coupon.discount_value}`
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            ${coupon.minimum_order_usd} / ₹{coupon.minimum_order_inr}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {coupon.valid_until
                                                ? `Until ${format(new Date(coupon.valid_until), 'MMM d, yyyy')}`
                                                : 'No expiry'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={coupon.is_active}
                                                onCheckedChange={() => handleToggleActive(coupon)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Delete coupon "{coupon.code}"? This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(coupon.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
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

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                                    placeholder="SAVE20"
                                    className="uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select value={form.discount_type} onValueChange={(v) => setForm(p => ({ ...p, discount_type: v as AdminCoupon['discount_type'] }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_usd">Fixed USD ($)</SelectItem>
                                        <SelectItem value="fixed_inr">Fixed INR (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Save 20% on your order"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Value</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.discount_value}
                                    onChange={(e) => setForm(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            {form.discount_type === 'percentage' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Max Discount ($)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.max_discount_usd ?? ''}
                                            onChange={(e) => setForm(p => ({ ...p, max_discount_usd: e.target.value ? parseFloat(e.target.value) : null }))}
                                            placeholder="No limit"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Discount (₹)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.max_discount_inr ?? ''}
                                            onChange={(e) => setForm(p => ({ ...p, max_discount_inr: e.target.value ? parseFloat(e.target.value) : null }))}
                                            placeholder="No limit"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Order (USD)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.minimum_order_usd}
                                    onChange={(e) => setForm(p => ({ ...p, minimum_order_usd: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order (INR)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.minimum_order_inr}
                                    onChange={(e) => setForm(p => ({ ...p, minimum_order_inr: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valid From</Label>
                                <Input
                                    type="date"
                                    value={form.valid_from}
                                    onChange={(e) => setForm(p => ({ ...p, valid_from: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valid Until (optional)</Label>
                                <Input
                                    type="date"
                                    value={form.valid_until || ''}
                                    onChange={(e) => setForm(p => ({ ...p, valid_until: e.target.value || null }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm(p => ({ ...p, is_active: checked }))}
                            />
                            <Label>Active</Label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCoupons;
