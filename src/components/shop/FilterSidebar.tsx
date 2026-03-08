import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Category } from "@/hooks/useCategories";
import { Star, X, ChevronDown } from "lucide-react";
import { BOOK_SUBCATEGORY_IDS } from "@/data/products";

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceRangeChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockChange: (checked: boolean) => void;
  onSaleOnly: boolean;
  onSaleChange: (checked: boolean) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  onClearFilters: () => void;
  productCounts: Record<string, number>;
  currencySymbol: string;
}

const bookSubcatSet = new Set<string>(BOOK_SUBCATEGORY_IDS);

function CategoriesSection({ categories, selectedCategory, onCategoryChange, productCounts }: {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  productCounts: Record<string, number>;
}) {
  const [booksOpen, setBooksOpen] = useState(true);

  const bookSubcats = categories.filter(c => bookSubcatSet.has(c.slug));
  const booksCount = bookSubcats.reduce((sum, c) => sum + (productCounts[c.slug] || 0), 0);
  const clothingCount = productCounts['clothing'] || 0;

  return (
    <div>
      <h3 className="text-xs tracking-[0.2em] uppercase mb-4 font-medium">Categories</h3>
      <div className="space-y-1">
        <Button
          variant={selectedCategory === 'all' ? "default" : "ghost"}
          className="w-full justify-start rounded-sm text-sm"
          onClick={() => onCategoryChange('all')}
        >
          All Products
          <span className="ml-auto text-xs text-muted-foreground">{productCounts['all'] || 0}</span>
        </Button>

        {/* Books (expandable) */}
        <div>
          <Button
            variant={selectedCategory === 'Books' ? "default" : "ghost"}
            className="w-full justify-between rounded-sm text-sm"
            onClick={() => onCategoryChange('Books')}
          >
            <span>Books</span>
            <span className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{booksCount}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${booksOpen ? 'rotate-180' : ''}`}
                onClick={(e) => { e.stopPropagation(); setBooksOpen(!booksOpen); }}
              />
            </span>
          </Button>
          {booksOpen && (
            <div className="pl-3 space-y-0.5 mt-0.5">
              {bookSubcats.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.slug ? "default" : "ghost"}
                  className="w-full justify-start rounded-sm text-sm h-8"
                  onClick={() => onCategoryChange(cat.slug)}
                >
                  {cat.name}
                  <span className="ml-auto text-xs text-muted-foreground">{productCounts[cat.slug] || 0}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Clothing */}
        <Button
          variant={selectedCategory === 'clothing' ? "default" : "ghost"}
          className="w-full justify-start rounded-sm text-sm"
          onClick={() => onCategoryChange('clothing')}
        >
          Clothing
          <span className="ml-auto text-xs text-muted-foreground">{clothingCount}</span>
        </Button>
      </div>
    </div>
  );
}

const FilterSidebar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  maxPrice,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  onSaleOnly,
  onSaleChange,
  minRating,
  onRatingChange,
  onClearFilters,
  productCounts,
  currencySymbol,
}: FilterSidebarProps) => {
  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    priceRange[0] > 0 || 
    priceRange[1] < maxPrice || 
    inStockOnly || 
    onSaleOnly || 
    minRating > 0;

  return (
    <Card className="rounded-sm border-border/50 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <CardContent className="p-6 space-y-6">
        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        )}

        {/* Categories */}
        <CategoriesSection
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          productCounts={productCounts}
        />

        <Separator />

        {/* Price Range */}
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-4 font-medium">Price Range</h3>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              min={0}
              max={maxPrice}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currencySymbol}{priceRange[0]}</span>
              <span>{currencySymbol}{priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase mb-4 font-medium">Availability</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="in-stock" 
                checked={inStockOnly}
                onCheckedChange={(checked) => onInStockChange(checked === true)}
              />
              <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                In Stock Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="on-sale" 
                checked={onSaleOnly}
                onCheckedChange={(checked) => onSaleChange(checked === true)}
              />
              <Label htmlFor="on-sale" className="text-sm cursor-pointer">
                On Sale
              </Label>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
