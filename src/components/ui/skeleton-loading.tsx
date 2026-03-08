import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return <div className={cn("skeleton", className)} />;
};

// Product Card Skeleton
export const ProductCardSkeleton = () => {
    return (
        <div className="bg-card rounded-lg overflow-hidden">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/4 mt-3" />
            </div>
        </div>
    );
};

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => {
    return (
        <div className="flex items-center gap-4 py-4 border-b">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
    );
};

// Text Skeleton
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
                />
            ))}
        </div>
    );
};

// Card Skeleton
export const CardSkeleton = () => {
    return (
        <div className="bg-card rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <TextSkeleton lines={2} />
        </div>
    );
};

export default Skeleton;
