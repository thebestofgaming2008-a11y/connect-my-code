import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAdminSiteSections, useUpdateSection, useCreateSection, useDeleteSection, SiteSection } from '@/hooks/useSiteSections';
import { useAdminProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Trash2, Plus, Save, X, Loader2, GripVertical, Image } from 'lucide-react';
import { ICON_MAP } from '@/pages/Index';

const ICON_OPTIONS = [
  'Shield', 'ShieldCheck', 'BadgeCheck', 'CheckCircle', 'Award', 'Crown', 'Ribbon',
  'Truck', 'Package', 'ShoppingBag', 'Receipt', 'CreditCard', 'Banknote', 'Landmark',
  'Star', 'Sparkles', 'Gem', 'Flame', 'Zap', 'ThumbsUp', 'Handshake', 'HandHeart',
  'Heart', 'Gift', 'BookOpen', 'BookMarked', 'Globe', 'MapPin', 'Timer', 'Clock',
  'Lock', 'Fingerprint', 'Users', 'Headphones', 'MessageCircle', 'Phone', 'Mail',
  'Instagram', 'ExternalLink', 'Megaphone', 'CalendarCheck', 'Palette',
  'Leaf', 'Sun', 'Moon', 'Quote',
];

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  trust_indicators: 'Trust Indicators',
  featured_products: 'Featured Products',
  product_grid: 'Product Grid (Pick Products)',
  categories_carousel: 'Categories Carousel',
  why_choose_us: 'Why Choose Us',
  reviews: 'Customer Reviews',
  custom_banner: 'Custom Banner',
  custom_text: 'Custom Text Block',
};

const ADDABLE_TYPES = [
  { key: 'product_grid', label: 'Product Grid (Pick Products)' },
  { key: 'custom_banner', label: 'Custom Banner' },
  { key: 'custom_text', label: 'Custom Text Block' },
  { key: 'featured_products', label: 'Featured Products (auto)' },
  { key: 'reviews', label: 'Customer Reviews (extra)' },
];

const LAYOUT_OPTIONS = [
  { value: '2', label: '2 Columns' },
  { value: '3', label: '3 Columns' },
  { value: '4', label: '4 Columns' },
];

const MOBILE_COLUMNS_OPTIONS = [
  { value: '1', label: '1 Column' },
  { value: '2', label: '2 Columns' },
  { value: 'auto', label: 'Same as Desktop' },
];

const MOBILE_LAYOUT_OPTIONS = [
  { value: 'stack', label: 'Vertical Stack (default)' },
  { value: 'scroll', label: 'Horizontal Scroll' },
];

const SECTIONS_WITH_MOBILE_CONTROLS = ['featured_products', 'product_grid', 'reviews', 'why_choose_us', 'trust_indicators'];

const AdminSections = () => {
  const { toast } = useToast();
  const { data: sections = [], isLoading, refetch } = useAdminSiteSections('home');
  const { data: allProducts = [] } = useAdminProducts();
  const updateSection = useUpdateSection();
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SiteSection>>({});

  const isDefault = (id: string) => id.startsWith('default-');

  const handleToggleVisibility = async (section: SiteSection) => {
    if (isDefault(section.id)) {
      toast({ title: 'Run SQL first', description: 'Run supabase/site-sections.sql in Supabase SQL Editor to enable section management.', variant: 'destructive' });
      return;
    }
    try {
      await updateSection.mutateAsync({ id: section.id, updates: { is_visible: !section.is_visible } });
      toast({ title: section.is_visible ? 'Section hidden' : 'Section visible' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || isDefault(sections[index].id)) return;
    const current = sections[index];
    const prev = sections[index - 1];
    try {
      await updateSection.mutateAsync({ id: current.id, updates: { sort_order: prev.sort_order } });
      await updateSection.mutateAsync({ id: prev.id, updates: { sort_order: current.sort_order } });
      refetch();
    } catch {
      toast({ title: 'Error', description: 'Failed to reorder', variant: 'destructive' });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sections.length - 1 || isDefault(sections[index].id)) return;
    const current = sections[index];
    const next = sections[index + 1];
    try {
      await updateSection.mutateAsync({ id: current.id, updates: { sort_order: next.sort_order } });
      await updateSection.mutateAsync({ id: next.id, updates: { sort_order: current.sort_order } });
      refetch();
    } catch {
      toast({ title: 'Error', description: 'Failed to reorder', variant: 'destructive' });
    }
  };

  const startEdit = (section: SiteSection) => {
    if (isDefault(section.id)) {
      toast({ title: 'Run SQL first', description: 'Run supabase/site-sections.sql in Supabase SQL Editor to enable section management.', variant: 'destructive' });
      return;
    }
    setEditingId(section.id);
    setEditForm({ title: section.title, subtitle: section.subtitle, content: section.content });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateSection.mutateAsync({ id: editingId, updates: editForm });
      toast({ title: 'Section updated' });
      cancelEdit();
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleAddSection = async (type: string) => {
    if (isDefault(sections[0]?.id)) {
      toast({ title: 'Run SQL first', description: 'Run supabase/site-sections.sql in Supabase SQL Editor to enable section management.', variant: 'destructive' });
      return;
    }
    const maxOrder = Math.max(...sections.map(s => s.sort_order), -1);
    const defaults: Record<string, any> = {
      product_grid: { title: 'Handpicked For You', subtitle: 'Selected products from our collection', content: { product_ids: [], columns: 4 } },
      custom_banner: { title: 'New Banner', subtitle: 'Add your description here', content: { text: '', image_url: '', cta_text: 'Learn More', cta_link: '/shop' } },
      custom_text: { title: 'New Section', subtitle: '', content: { text: 'Your content here' } },
      featured_products: { title: 'More Products', subtitle: 'Check out more from our collection', content: { product_count: 4, columns: 4 } },
      reviews: { title: 'More Reviews', subtitle: '', content: { items: [] } },
    };
    const d = defaults[type] || { title: 'New Section', subtitle: '', content: {} };
    try {
      await createSection.mutateAsync({
        page: 'home', section_key: type, title: d.title, subtitle: d.subtitle, content: d.content,
        sort_order: maxOrder + 1, is_visible: true,
      });
      toast({ title: 'Section added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add section', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSection.mutateAsync(id);
      toast({ title: 'Section deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const updateContentField = (path: string, value: any) => {
    setEditForm(prev => {
      const content = { ...(prev.content || {}) };
      content[path] = value;
      return { ...prev, content };
    });
  };

  const updateContentItem = (index: number, field: string, value: any) => {
    setEditForm(prev => {
      const content = { ...(prev.content || {}) };
      const items = [...(content.items || [])];
      items[index] = { ...items[index], [field]: value };
      content.items = items;
      return { ...prev, content };
    });
  };

  const addContentItem = (template: Record<string, any>) => {
    setEditForm(prev => {
      const content = { ...(prev.content || {}) };
      content.items = [...(content.items || []), template];
      return { ...prev, content };
    });
  };

  const removeContentItem = (index: number) => {
    setEditForm(prev => {
      const content = { ...(prev.content || {}) };
      content.items = (content.items || []).filter((_: any, i: number) => i !== index);
      return { ...prev, content };
    });
  };

  const renderEditForm = (section: SiteSection) => {
    const key = section.section_key;
    return (
      <Card className="border-primary">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Editing: {SECTION_LABELS[key] || key}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={saveEdit} disabled={updateSection.isPending}>
                {updateSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={editForm.subtitle || ''} onChange={e => setEditForm(p => ({ ...p, subtitle: e.target.value }))} />
            </div>
          </div>

          {key === 'hero' && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Hero Content</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Button 1 Text</Label><Input value={editForm.content?.cta_text || ''} onChange={e => updateContentField('cta_text', e.target.value)} /></div>
                <div><Label>Button 1 Link</Label><Input value={editForm.content?.cta_link || ''} onChange={e => updateContentField('cta_link', e.target.value)} /></div>
                <div><Label>Button 2 Text</Label><Input value={editForm.content?.cta2_text || ''} onChange={e => updateContentField('cta2_text', e.target.value)} /></div>
                <div><Label>Button 2 Link</Label><Input value={editForm.content?.cta2_link || ''} onChange={e => updateContentField('cta2_link', e.target.value)} /></div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">Hero Product Images (3 shown as stacked books)</h4>
                  {(editForm.content?.hero_product_ids || []).length > 0 && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => updateContentField('hero_product_ids', [])}>Clear</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Pick up to 3 products whose images will appear in the hero section. Leave empty to auto-select.</p>
                <div className="border rounded-lg p-3 max-h-36 overflow-y-auto space-y-1">
                  {allProducts.filter(p => (editForm.content?.hero_product_ids || []).includes(p.id)).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1 px-2 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.cover_image_url ? <img src={p.cover_image_url} className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <Image className="w-8 h-8 text-muted-foreground flex-shrink-0" />}
                        <span className="truncate">{p.name}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => {
                        const ids = (editForm.content?.hero_product_ids || []).filter((id: string) => id !== p.id);
                        updateContentField('hero_product_ids', ids);
                      }}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {(editForm.content?.hero_product_ids || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Auto-selecting first 3 products with images</p>}
                </div>
                {(editForm.content?.hero_product_ids || []).length < 3 && (
                  <div>
                    <Label>Add Product</Label>
                    <Select onValueChange={id => {
                      const current = editForm.content?.hero_product_ids || [];
                      if (current.length < 3 && !current.includes(id)) updateContentField('hero_product_ids', [...current, id]);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {allProducts.filter(p => p.images?.[0] && !(editForm.content?.hero_product_ids || []).includes(p.id)).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {key === 'featured_products' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Auto-select count (if no products picked)</Label><Input type="number" min={1} max={12} value={editForm.content?.product_count || 4} onChange={e => updateContentField('product_count', parseInt(e.target.value) || 4)} /></div>
                <div><Label>Columns</Label>
                  <Select value={String(editForm.content?.columns || 4)} onValueChange={v => updateContentField('columns', parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LAYOUT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">Pick Specific Products (optional)</h4>
                  {(editForm.content?.product_ids || []).length > 0 && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => updateContentField('product_ids', [])}>Clear all</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">If you pick products here, they'll be shown instead of auto-selected ones.</p>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {allProducts.filter(p => (editForm.content?.product_ids || []).includes(p.id)).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1 px-2 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.cover_image_url ? <img src={p.cover_image_url} className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <Image className="w-8 h-8 text-muted-foreground flex-shrink-0" />}
                        <span className="truncate">{p.name}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => {
                        const ids = (editForm.content?.product_ids || []).filter((id: string) => id !== p.id);
                        updateContentField('product_ids', ids);
                      }}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {(editForm.content?.product_ids || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No products picked — auto-selecting featured products</p>}
                </div>
                <div>
                  <Label>Add Product</Label>
                  <Select onValueChange={id => {
                    const current = editForm.content?.product_ids || [];
                    if (!current.includes(id)) updateContentField('product_ids', [...current, id]);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allProducts.filter(p => !(editForm.content?.product_ids || []).includes(p.id)).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {key === 'product_grid' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Selected Products</h4>
                <div><Label className="mr-2">Columns</Label>
                  <Select value={String(editForm.content?.columns || 4)} onValueChange={v => updateContentField('columns', parseInt(v))}>
                    <SelectTrigger className="w-32 inline-flex"><SelectValue /></SelectTrigger>
                    <SelectContent>{LAYOUT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                {allProducts.filter(p => (editForm.content?.product_ids || []).includes(p.id)).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 px-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.cover_image_url ? <img src={p.cover_image_url} className="w-8 h-8 rounded object-cover flex-shrink-0" /> : <Image className="w-8 h-8 text-muted-foreground flex-shrink-0" />}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => {
                      const ids = (editForm.content?.product_ids || []).filter((id: string) => id !== p.id);
                      updateContentField('product_ids', ids);
                    }}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                {(editForm.content?.product_ids || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No products selected yet</p>}
              </div>
              <div>
                <Label>Add Product</Label>
                <Select onValueChange={id => {
                  const current = editForm.content?.product_ids || [];
                  if (!current.includes(id)) updateContentField('product_ids', [...current, id]);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allProducts.filter(p => !(editForm.content?.product_ids || []).includes(p.id)).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {key === 'trust_indicators' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center"><h4 className="font-medium text-sm">Indicators</h4>
                <Button size="sm" variant="outline" onClick={() => addContentItem({ icon: 'Shield', text: 'New indicator', color: 'text-primary' })}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              {(editForm.content?.items || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="w-28">
                    <Label>Icon</Label>
                    <Select value={item.icon || 'Shield'} onValueChange={v => updateContentItem(i, 'icon', v)}>
                      <SelectTrigger>{(() => { const Ic = ICON_MAP[item.icon]; return Ic ? <span className="flex items-center gap-1.5"><Ic className="h-4 w-4" />{item.icon}</span> : item.icon; })()}</SelectTrigger>
                      <SelectContent className="max-h-60">
                        {ICON_OPTIONS.map(ic => { const Ic = ICON_MAP[ic]; return (
                          <SelectItem key={ic} value={ic}><span className="flex items-center gap-2">{Ic && <Ic className="h-4 w-4" />}{ic}</span></SelectItem>
                        ); })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1"><Label>Text</Label><Input value={item.text || ''} onChange={e => updateContentItem(i, 'text', e.target.value)} /></div>
                  <div className="w-36">
                    <Label>Color</Label>
                    <Select value={item.color || 'text-primary'} onValueChange={v => updateContentItem(i, 'color', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-primary">Primary</SelectItem>
                        <SelectItem value="text-green-600">Green</SelectItem>
                        <SelectItem value="text-blue-600">Blue</SelectItem>
                        <SelectItem value="text-yellow-500">Yellow</SelectItem>
                        <SelectItem value="text-red-500">Red</SelectItem>
                        <SelectItem value="text-purple-600">Purple</SelectItem>
                        <SelectItem value="text-orange-500">Orange</SelectItem>
                        <SelectItem value="text-teal-600">Teal</SelectItem>
                        <SelectItem value="text-muted-foreground">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeContentItem(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}

          {key === 'why_choose_us' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center"><h4 className="font-medium text-sm">Features</h4>
                <Button size="sm" variant="outline" onClick={() => addContentItem({ icon: 'Star', title: 'New Feature', description: 'Description here' })}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              {(editForm.content?.items || []).map((item: any, i: number) => (
                <div key={i} className="p-3 border rounded space-y-2">
                  <div className="flex gap-2">
                    <div className="w-28">
                      <Label>Icon</Label>
                      <Select value={item.icon || 'Star'} onValueChange={v => updateContentItem(i, 'icon', v)}>
                        <SelectTrigger>{(() => { const Ic = ICON_MAP[item.icon]; return Ic ? <span className="flex items-center gap-1.5"><Ic className="h-4 w-4" />{item.icon}</span> : item.icon; })()}</SelectTrigger>
                        <SelectContent className="max-h-60">
                          {ICON_OPTIONS.map(ic => { const Ic = ICON_MAP[ic]; return (
                            <SelectItem key={ic} value={ic}><span className="flex items-center gap-2">{Ic && <Ic className="h-4 w-4" />}{ic}</span></SelectItem>
                          ); })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1"><Label>Title</Label><Input value={item.title || ''} onChange={e => updateContentItem(i, 'title', e.target.value)} /></div>
                    <Button size="icon" variant="ghost" className="text-destructive self-end" onClick={() => removeContentItem(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div><Label>Description</Label><Input value={item.description || ''} onChange={e => updateContentItem(i, 'description', e.target.value)} /></div>
                </div>
              ))}
            </div>
          )}

          {key === 'reviews' && (
            <div className="space-y-3">
              <div>
                <Label>Instagram Reviews Link ("See More" button)</Label>
                <Input value={editForm.content?.instagram_link || ''} onChange={e => updateContentField('instagram_link', e.target.value)} placeholder="https://www.instagram.com/abuhurayrahessentials/" />
              </div>
              <div className="flex justify-between items-center"><h4 className="font-medium text-sm">Reviews</h4>
                <Button size="sm" variant="outline" onClick={() => addContentItem({ name: '', rating: 5, text: '', date: '' })}><Plus className="h-3 w-3 mr-1" /> Add Review</Button>
              </div>
              {(editForm.content?.items || []).map((item: any, i: number) => (
                <div key={i} className="p-3 border rounded space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1"><Label>Name</Label><Input value={item.name || ''} onChange={e => updateContentItem(i, 'name', e.target.value)} /></div>
                    <div className="w-20"><Label>Rating</Label><Input type="number" min={1} max={5} value={item.rating || 5} onChange={e => updateContentItem(i, 'rating', parseInt(e.target.value) || 5)} /></div>
                    <div className="w-32"><Label>Date</Label><Input value={item.date || ''} onChange={e => updateContentItem(i, 'date', e.target.value)} /></div>
                    <Button size="icon" variant="ghost" className="text-destructive self-end" onClick={() => removeContentItem(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div><Label>Review Text</Label><Textarea value={item.text || ''} onChange={e => updateContentItem(i, 'text', e.target.value)} rows={2} /></div>
                </div>
              ))}
            </div>
          )}

          {SECTIONS_WITH_MOBILE_CONTROLS.includes(key) && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">Mobile Display</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Mobile Columns</Label>
                  <Select value={String(editForm.content?.mobile_columns || '1')} onValueChange={v => updateContentField('mobile_columns', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MOBILE_COLUMNS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mobile Layout</Label>
                  <Select value={editForm.content?.mobile_layout || 'stack'} onValueChange={v => updateContentField('mobile_layout', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MOBILE_LAYOUT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Controls how this section appears on phones. "Horizontal Scroll" makes items swipeable side-to-side.</p>
            </div>
          )}

          {(key === 'custom_banner' || key === 'custom_text') && (
            <div className="space-y-3">
              <div><Label>Content Text</Label><Textarea value={editForm.content?.text || ''} onChange={e => updateContentField('text', e.target.value)} rows={3} /></div>
              {key === 'custom_banner' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Image URL</Label><Input value={editForm.content?.image_url || ''} onChange={e => updateContentField('image_url', e.target.value)} /></div>
                  <div><Label>Button Text</Label><Input value={editForm.content?.cta_text || ''} onChange={e => updateContentField('cta_text', e.target.value)} /></div>
                  <div><Label>Button Link</Label><Input value={editForm.content?.cta_link || ''} onChange={e => updateContentField('cta_link', e.target.value)} /></div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Homepage Sections</h2>
          <p className="text-sm text-muted-foreground">Reorder, show/hide, and customize each section of the homepage</p>
        </div>
        <Select onValueChange={handleAddSection}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Add section..." /></SelectTrigger>
          <SelectContent>
            {ADDABLE_TYPES.map(t => (
              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sections.map((section, index) => (
        editingId === section.id ? (
          <div key={section.id}>{renderEditForm(section)}</div>
        ) : (
          <Card key={section.id} className={`transition-opacity ${!section.is_visible ? 'opacity-50' : ''}`}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveUp(index)}><ArrowUp className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === sections.length - 1} onClick={() => handleMoveDown(index)}><ArrowDown className="h-3 w-3" /></Button>
                </div>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{SECTION_LABELS[section.section_key] || section.section_key}</p>
                  <p className="text-xs text-muted-foreground truncate">{section.title || '(no title)'} — {section.subtitle || '(no subtitle)'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleToggleVisibility(section)} title={section.is_visible ? 'Hide' : 'Show'}>
                    {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(section)}><Pencil className="h-4 w-4" /></Button>
                  {!['hero', 'featured_products', 'categories_carousel', 'why_choose_us', 'trust_indicators'].includes(section.section_key) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Section</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove this section from the homepage.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(section.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      ))}

      {isDefault(sections[0]?.id || '') && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-muted-foreground">
            <p className="text-sm">Section management requires the database table.</p>
            <p className="text-xs mt-1">Run <code className="bg-muted px-1 rounded">supabase/site-sections.sql</code> in your Supabase SQL Editor to enable editing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSections;
