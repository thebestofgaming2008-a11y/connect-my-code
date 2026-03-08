import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCreateProduct, useUpdateProduct, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Plus, Link2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { z } from 'zod';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  description: z.string().max(2000).optional(),
  author: z.string().max(200).optional().nullable(),
  publisher: z.string().max(200).optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  pages: z.number().min(0).optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  binding: z.string().max(50).optional().nullable(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  price_inr: z.number().min(1, 'INR price is required'),
  sale_price: z.number().min(0).optional().nullable(),
  sale_price_inr: z.number().min(0).optional().nullable(),
  category: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  cover_image_url: z.string().optional().nullable(),
  stock_quantity: z.number().min(0).default(10),
  badge: z.string().max(20).optional().nullable(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    author: null,
    publisher: null,
    language: 'English',
    pages: null,
    isbn: null,
    binding: 'Paperback',
    price: 0,
    price_inr: 0,
    sale_price: null,
    sale_price_inr: null,
    category: null,
    images: [],
    cover_image_url: null,
    stock_quantity: 10,
    badge: null,
    is_featured: false,
    is_active: true,
  });

  const [imageInput, setImageInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoConvert, setAutoConvert] = useState(true);
  const { exchangeRate: INR_RATE } = useCurrencyContext();
  const [variantGroup, setVariantGroup] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        author: product.author,
        publisher: product.publisher,
        language: product.language || 'English',
        pages: product.pages,
        isbn: product.isbn,
        binding: product.binding || 'Paperback',
        price: product.price,
        price_inr: product.price_inr,
        sale_price: product.sale_price,
        sale_price_inr: product.sale_price_inr,
        category: product.category,
        images: product.images || [],
        cover_image_url: product.cover_image_url,
        stock_quantity: product.stock_quantity ?? 10,
        badge: product.badge,
        is_featured: product.is_featured ?? false,
        is_active: product.is_active ?? true,
      });
      const vgTag = product.tags?.find(t => t.startsWith('vg:'));
      setVariantGroup(vgTag ? vgTag.replace('vg:', '') : '');
    }
  }, [product]);

  // Auto-convert INR to USD when enabled
  useEffect(() => {
    if (autoConvert && formData.price_inr && formData.price_inr > 0 && INR_RATE > 0) {
      setFormData(prev => ({
        ...prev,
        price: Math.round((prev.price_inr! / INR_RATE) * 100) / 100,
        sale_price: prev.sale_price_inr ? Math.round((prev.sale_price_inr / INR_RATE) * 100) / 100 : null,
      }));
    }
  }, [formData.price_inr, formData.sale_price_inr, autoConvert]);

  const handleChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        author: formData.author,
        publisher: formData.publisher,
        language: formData.language,
        pages: formData.pages,
        isbn: formData.isbn,
        binding: formData.binding,
        price: formData.price,
        price_inr: formData.price_inr,
        sale_price: formData.sale_price,
        sale_price_inr: formData.sale_price_inr,
        category: formData.category,
        images: formData.images,
        cover_image_url: formData.cover_image_url || formData.images[0] || null,
        stock_quantity: formData.stock_quantity,
        badge: formData.badge,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      const existingTags = product?.tags?.filter(t => !t.startsWith('vg:')) || [];
      const tags = variantGroup.trim()
        ? [...existingTags, `vg:${variantGroup.trim().toLowerCase().replace(/\s+/g, '-')}`]
        : existingTags;
      const dataWithTags = { ...productData, tags: tags.length > 0 ? tags : null };

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (product && isUUID.test(product.id)) {
        await updateProduct.mutateAsync({ id: product.id, updates: dataWithTags });
        toast({ title: 'Product updated successfully' });
      } else {
        await createProduct.mutateAsync(dataWithTags);
        toast({ title: product ? 'Product saved to database' : 'Product created successfully' });
      }
      onSuccess?.();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{product ? 'Edit Product' : 'New Product'}</h2>
          <p className="text-sm text-gray-500">{product ? `Editing "${product.name}"` : 'Fill in the details below to add a product'}</p>
        </div>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  if (!product) {
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    handleChange('slug', slug);
                  }
                }}
                placeholder="e.g. Kitab At-Tawheed"
                className="h-9"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="kitab-at-tawheed"
                className="h-9"
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="author" className="text-xs">Author</Label>
              <Input id="author" value={formData.author || ''} onChange={(e) => handleChange('author', e.target.value || null)} placeholder="Author name" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="publisher" className="text-xs">Publisher</Label>
              <Input id="publisher" value={formData.publisher || ''} onChange={(e) => handleChange('publisher', e.target.value || null)} placeholder="Publisher name" className="h-9" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Product description..." rows={3} className="text-sm" />
            </div>
          </div>
        </div>

        {/* Section: Categorization */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Categorization</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="badge" className="text-xs">Badge</Label>
              <Input id="badge" value={formData.badge || ''} onChange={(e) => handleChange('badge', e.target.value || null)} placeholder="e.g. Bestseller" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant_group" className="text-xs">Variant Group</Label>
              <Input id="variant_group" value={variantGroup} onChange={(e) => setVariantGroup(e.target.value)} placeholder="e.g. kitab-at-tawheed" className="h-9" />
              <p className="text-[11px] text-gray-400">Links editions together. Leave empty if standalone.</p>
            </div>
          </div>
        </div>

        {/* Section: Pricing */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pricing</h3>
            <div className="flex items-center gap-2">
              <Switch id="auto-convert" checked={autoConvert} onCheckedChange={setAutoConvert} />
              <Label htmlFor="auto-convert" className="text-xs text-gray-500">
                Auto-convert to USD (Rate: {INR_RATE.toFixed(1)})
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price_inr" className="text-xs font-medium">Price (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <Input id="price_inr" type="number" step="0.01" min="0" value={formData.price_inr || ''} onChange={(e) => handleChange('price_inr', parseFloat(e.target.value) || null)} placeholder="0" className="h-9 pl-7" />
              </div>
              {errors.price_inr && <p className="text-xs text-red-500">{errors.price_inr}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price_inr" className="text-xs">Sale Price (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <Input id="sale_price_inr" type="number" step="0.01" min="0" value={formData.sale_price_inr || ''} onChange={(e) => handleChange('sale_price_inr', parseFloat(e.target.value) || null)} placeholder="—" className="h-9 pl-7" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs">Price ($) {autoConvert && <span className="text-gray-400">auto</span>}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <Input id="price" type="number" step="0.01" min="0" value={formData.price || ''} onChange={(e) => { setAutoConvert(false); handleChange('price', parseFloat(e.target.value) || 0); }} placeholder="0.00" className={`h-9 pl-7 ${autoConvert ? 'bg-gray-50 text-gray-500' : ''}`} readOnly={autoConvert} />
              </div>
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price" className="text-xs">Sale ($) {autoConvert && <span className="text-gray-400">auto</span>}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <Input id="sale_price" type="number" step="0.01" min="0" value={formData.sale_price || ''} onChange={(e) => { setAutoConvert(false); handleChange('sale_price', parseFloat(e.target.value) || null); }} placeholder="—" className={`h-9 pl-7 ${autoConvert ? 'bg-gray-50 text-gray-500' : ''}`} readOnly={autoConvert} />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Images */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Images</h3>
          <ImageUpload
            images={formData.images}
            onImagesChange={(imgs) => handleChange('images', imgs)}
          />
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs">
              <Link2 className="h-3 w-3" /> Or add by URL
            </summary>
            <div className="flex gap-2 mt-2">
              <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="https://... image URL" className="h-9" />
              <Button type="button" variant="outline" size="sm" onClick={addImage}><Plus className="h-4 w-4" /></Button>
            </div>
          </details>
        </div>

        {/* Section: Inventory & Visibility */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Inventory & Visibility</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="stock_quantity" className="text-xs">Stock Quantity</Label>
              <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)} placeholder="10" className="h-9" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleChange('is_active', checked)} />
              <div>
                <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                <p className="text-[11px] text-gray-400">Visible in the shop</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => handleChange('is_featured', checked)} />
              <div>
                <Label htmlFor="is_featured" className="text-sm font-medium">Featured</Label>
                <p className="text-[11px] text-gray-400">Show on homepage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions — sticky on mobile */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-gray-50 py-4 -mx-1 px-1 z-10 border-t border-gray-100">
          <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
