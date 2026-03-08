import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminProducts, useImportStaticProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import ProductsTable from './ProductsTable';
import ProductForm from './ProductForm';
import { Plus, Search, RefreshCw, Loader2, Download, Package } from 'lucide-react';

const AdminProducts = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const { data: products = [], isLoading, refetch } = useAdminProducts();
    const { data: categories = [] } = useCategories();
    const importProducts = useImportStaticProducts();

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.author?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            product.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProduct(null);
        refetch();
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingProduct(null);
    };

    if (showForm) {
        return (
            <ProductForm
                product={editingProduct}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
            />
        );
    }

    return (
        <div className="space-y-5">
            {/* Search + filters + actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9 bg-white border-gray-200"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-36 h-9 bg-white border-gray-200">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => refetch()}>
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    {products.length < 10 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            disabled={importProducts.isPending}
                            onClick={async () => {
                                try {
                                    const res = await importProducts.mutateAsync();
                                    toast({
                                        title: 'Catalog imported',
                                        description: `${res.imported} products imported, ${res.skipped} already existed${res.errors ? `, ${res.errors} errors` : ''}.`,
                                    });
                                } catch (err: any) {
                                    toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
                                }
                            }}
                        >
                            {importProducts.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                            Import
                        </Button>
                    )}
                    <Button size="sm" className="h-9" onClick={() => setShowForm(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Products list */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                        {(searchQuery || categoryFilter !== 'all') && ' found'}
                    </p>
                </div>
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No products found</p>
                    </div>
                ) : (
                    <div className="px-4 pb-2">
                        <ProductsTable
                            products={filteredProducts}
                            onEdit={handleEdit}
                            loading={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
