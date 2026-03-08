import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Product, useDeleteProduct } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Star, MoreHorizontal, Loader2 } from 'lucide-react';
import ProductImage from '@/components/ui/product-image';
import { formatOrderCurrency } from '@/lib/pricing';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  loading?: boolean;
}

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const ProductsTable = ({ products, onEdit, loading }: ProductsTableProps) => {
  const { toast } = useToast();
  const deleteProduct = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; image?: string } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      toast({ title: 'Product deleted', description: `"${deleteTarget.name}" has been removed.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const stockIndicator = (qty: number | null) => {
    const q = qty ?? 0;
    if (q <= 0) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Out</span>;
    if (q <= 5) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{q}</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{q}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products found. Add your first product to get started.
      </div>
    );
  }

  return (
    <>
      {/* Product list — unified layout for mobile & desktop */}
      <div className="divide-y divide-gray-100">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 md:gap-4 py-3 px-1 hover:bg-gray-50/50 rounded-lg transition-colors group"
          >
            {/* Image */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <ProductImage src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</p>
                {product.is_featured && <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {product.author && <span className="text-xs text-gray-500 truncate max-w-[120px]">{product.author}</span>}
                {product.author && product.category && <span className="text-gray-300">·</span>}
                <span className="text-xs text-gray-500 capitalize">{product.category}</span>
                {product.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{product.badge}</Badge>}
              </div>
            </div>

            {/* Price — hidden on very small screens */}
            <div className="hidden sm:block text-right flex-shrink-0 min-w-[80px]">
              <p className="text-sm font-semibold text-gray-900">
                {product.price_inr
                  ? formatOrderCurrency('INR', product.sale_price_inr || product.price_inr)
                  : formatOrderCurrency('USD', product.sale_price || product.price)}
              </p>
              {(product.sale_price || product.sale_price_inr) && (
                <p className="text-xs text-gray-400 line-through">
                  {product.price_inr ? formatOrderCurrency('INR', product.price_inr) : formatOrderCurrency('USD', product.price)}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="hidden md:flex flex-shrink-0 min-w-[50px] justify-center">
              {stockIndicator(product.stock_quantity)}
            </div>

            {/* Edit button — always visible */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium flex-shrink-0"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>

            {/* More actions — delete is buried here for safety */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isUUID(product.id) ? (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    disabled={deletingId === product.id}
                    onClick={() => setDeleteTarget({ id: product.id, name: product.name, image: product.images?.[0] })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    Static product (import to DB to manage)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Shared delete confirmation dialog — shows product image & name prominently */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Product</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {deleteTarget?.image && (
                  <div className="flex justify-center">
                    <img src={deleteTarget.image} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  </div>
                )}
                <p className="text-center">
                  Are you sure you want to permanently delete <strong className="text-foreground">"{deleteTarget?.name}"</strong>?
                </p>
                <p className="text-center text-xs text-red-500 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletingId ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Deleting...</> : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsTable;
