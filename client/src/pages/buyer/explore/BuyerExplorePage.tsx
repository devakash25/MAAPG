import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buyerApi } from "@/services";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/utils/helpers";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Heart,
  Building,
} from "lucide-react";

const PROPERTY_TYPES = ["Apartment", "House", "Hostel", "PG", "Villa", "Studio"];
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];
const AMENITIES = [
  "WiFi",
  "AC",
  "Parking",
  "Gym",
  "Pool",
  "Kitchen",
  "Laundry",
  "Security",
  "Furnished",
  "Power Backup",
];
const RATING_OPTIONS = [4, 3, 2, 1];

export default function BuyerExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");

  const [filterTypes, setFilterTypes] = useState<string[]>(
    (searchParams.get("propertyType") || "").split(",").filter(Boolean)
  );
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") || "");
  const [filterAmenities, setFilterAmenities] = useState<string[]>(
    (searchParams.get("amenities") || "").split(",").filter(Boolean)
  );
  const [filterRating, setFilterRating] = useState<number>(
    Number(searchParams.get("rating")) || 0
  );

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];

  if (city) {
    activeFilters.push({ key: "city", label: city, clear: () => setCity("") });
  }
  filterTypes.forEach((t) =>
    activeFilters.push({
      key: `type-${t}`,
      label: t,
      clear: () => setFilterTypes((prev) => prev.filter((v) => v !== t)),
    })
  );
  if (priceMin) {
    activeFilters.push({
      key: "priceMin",
      label: `Min ₹${priceMin}`,
      clear: () => setPriceMin(""),
    });
  }
  if (priceMax) {
    activeFilters.push({
      key: "priceMax",
      label: `Max ₹${priceMax}`,
      clear: () => setPriceMax(""),
    });
  }
  filterAmenities.forEach((a) =>
    activeFilters.push({
      key: `amenity-${a}`,
      label: a,
      clear: () => setFilterAmenities((prev) => prev.filter((v) => v !== a)),
    })
  );
  if (filterRating > 0) {
    activeFilters.push({
      key: "rating",
      label: `${filterRating}+ Stars`,
      clear: () => setFilterRating(0),
    });
  }

  const currentPage = Number(searchParams.get("page")) || 1;
  const LIMIT = 12;

  const params: Record<string, any> = {
    page: currentPage,
    limit: LIMIT,
    search: searchQuery,
    city,
    propertyType: filterTypes.join(","),
    priceMin,
    priceMax,
    amenities: filterAmenities.join(","),
    rating: filterRating,
    sort,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["buyerExplore", params],
    queryFn: () => buyerApi.explore(params).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const properties: any[] = data?.data?.properties || data?.properties || [];
  const totalCount: number = data?.data?.totalCount || data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  const updateParams = (updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      if ("page" in updates) {
        // handled below
      } else {
        next.delete("page");
      }
      return next;
    });
  };

  const handleSearch = () => {
    updateParams({ search: searchQuery, city, page: "1" });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateParams({ sort: newSort, page: "1" });
  };

  const clearAllFilters = () => {
    setCity("");
    setFilterTypes([]);
    setPriceMin("");
    setPriceMax("");
    setFilterAmenities([]);
    setFilterRating(0);
    setSort("recommended");
    setSearchParams({});
  };

  const applyFilters = () => {
    updateParams({
      propertyType: filterTypes.join(","),
      priceMin,
      priceMax,
      amenities: filterAmenities.join(","),
      rating: filterRating ? String(filterRating) : "",
      page: "1",
    });
    setFilterOpen(false);
  };

  const toggleType = (t: string) => {
    setFilterTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  };

  const toggleAmenity = (a: string) => {
    setFilterAmenities((prev) =>
      prev.includes(a) ? prev.filter((v) => v !== a) : [...prev, a]
    );
  };

  const handleWishlist = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    try {
      await buyerApi.toggleWishlist(propertyId);
    } catch {
      // silently fail
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Properties
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Find your perfect accommodation
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              )}
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              )}
            />
          </div>
          <Button onClick={handleSearch} className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="px-4"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Sort + Active Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilters.length > 0 && (
              <>
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                      "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                    )}
                  >
                    {f.label}
                    <button onClick={f.clear} className="hover:text-sky-900 dark:hover:text-sky-100">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-1"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? "..." : `${totalCount} properties found`}
            </span>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-sky-500"
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <Home className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button onClick={clearAllFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Property Grid */}
        {!isLoading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <Card
                key={property.id}
                onClick={() => navigate(`/buyer/property/${property.id}`)}
                className="cursor-pointer group overflow-hidden border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Building className="h-12 w-12 text-gray-300 dark:text-gray-500" />
                    </div>
                  )}

                  {/* Type Badge */}
                  <span
                    className={cn(
                      "absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold",
                      "bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200"
                    )}
                  >
                    {property.type || property.propertyType}
                  </span>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleWishlist(e, property.id)}
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full",
                      "bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900",
                      "transition-colors duration-200"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        property.isWishlisted
                          ? "fill-red-500 text-red-500"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    />
                  </button>
                </div>

                <CardContent className="p-4">
                  {/* Name & City */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {property.city}, {property.state || ""}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.round(property.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 dark:text-gray-600"
                        )}
                      />
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      {property.rating?.toFixed?.(1) || property.rating || "N/A"}
                    </span>
                  </div>

                  {/* Amenity Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(property.amenities || []).slice(0, 3).map((amenity: string) => (
                      <span
                        key={amenity}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          "bg-gray-100 dark:bg-gray-700",
                          "text-gray-600 dark:text-gray-300"
                        )}
                      >
                        {amenity}
                      </span>
                    ))}
                    {(property.amenities || []).length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        +{(property.amenities || []).length - 3}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline">
                    <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                      ₹{(property.price || property.startingPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      /{property.priceUnit || "month"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const show =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;
              if (!show) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              }
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={cn(
                    page === currentPage &&
                      "bg-sky-500 hover:bg-sky-600 text-white"
                  )}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Fetching overlay indicator */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm shadow-lg animate-pulse">
            Updating...
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
            <button
              onClick={() => setFilterOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Property Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    filterTypes.includes(type)
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-600"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Price Range
            </h3>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="flex-1"
              />
              <span className="text-gray-400">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    filterAmenities.includes(amenity)
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-600"
                  )}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Minimum Rating
            </h3>
            <div className="flex gap-2">
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRating(filterRating === r ? 0 : r)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    filterRating === r
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-600"
                  )}
                >
                  {r}
                  <Star className="h-3.5 w-3.5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearAllFilters();
                setFilterOpen(false);
              }}
            >
              Clear All
            </Button>
            <Button className="flex-1" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
