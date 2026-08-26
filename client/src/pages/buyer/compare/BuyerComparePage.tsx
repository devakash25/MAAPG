import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/helpers';
import {
  Search, X, Plus, Scale, MapPin, Star, Building, Home,
  Wifi, Car, Utensils, Snowflake, Bath, Sofa, Trophy
} from 'lucide-react';

const amenityIcons: Record<string, any> = {
  WiFi: Wifi, AC: Snowflake, Food: Utensils, Parking: Car,
  'Attached Bathroom': Bath, Furnished: Sofa,
};

const amenityKeys = ['WiFi', 'AC', 'Food', 'Parking', 'Attached Bathroom', 'Furnished'];

function PropertyChip({ property, onRemove }: { property: any; onRemove: () => void }) {
  const img = property.images?.[0]?.url;

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full pr-1 pl-1 py-1 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home size={14} className="text-gray-400" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-2 max-w-[120px] truncate">
        {property.name}
      </span>
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <X size={12} className="text-gray-500 hover:text-red-500" />
      </button>
    </div>
  );
}

function SearchResult({ property, isSelected, onToggle }: { property: any; isSelected: boolean; onToggle: () => void }) {
  const img = property.images?.[0]?.url;
  const price = property.rooms?.[0]?.pricePerMonth || property.rooms?.[0]?.pricePerNight;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isSelected
          ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-sky-200 dark:hover:border-sky-800'
      )}
      onClick={onToggle}
    >
      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home size={20} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#0f172a] dark:text-white truncate text-sm">{property.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {property.city}
          </span>
          <span>{property.propertyType?.replace('_', ' ')}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {price && (
          <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
            ₹{Number(price).toLocaleString()}/mo
          </span>
        )}
        <Badge variant={isSelected ? 'default' : 'outline'} className="text-xs">
          {isSelected ? 'Selected' : 'Add'}
        </Badge>
      </div>
    </div>
  );
}

function ComparisonTable({ properties, bestMatchIndex }: { properties: any[]; bestMatchIndex: number }) {
  const getAmenity = (property: any, key: string) => {
    const amenity = property.amenities?.find(
      (a: any) => a.name?.toLowerCase() === key.toLowerCase()
    );
    return amenity ? true : false;
  };

  const getPrice = (property: any) => {
    return property.rooms?.[0]?.pricePerMonth || property.rooms?.[0]?.pricePerNight || null;
  };

  const rows = [
    {
      label: 'Type',
      icon: Building,
      render: (p: any) => p.propertyType?.replace('_', ' ') || '—',
    },
    {
      label: 'City',
      icon: MapPin,
      render: (p: any) => p.city || '—',
    },
    {
      label: 'Price',
      icon: null,
      render: (p: any) => {
        const price = getPrice(p);
        return price ? `₹${Number(price).toLocaleString()}/month` : '—';
      },
    },
    {
      label: 'Rating',
      icon: Star,
      render: (p: any) =>
        p.averageRating ? `⭐ ${Number(p.averageRating).toFixed(1)}` : 'No ratings',
    },
    ...amenityKeys.map((key) => ({
      label: key,
      icon: amenityIcons[key] || null,
      render: (p: any) => (getAmenity(p, key) ? '✓' : '✕'),
      isAmenity: true,
    })),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left p-3 bg-gray-50 dark:bg-gray-800/50 rounded-tl-lg text-sm font-semibold text-gray-600 dark:text-gray-400 w-40">
              Feature
            </th>
            {properties.map((property, idx) => (
              <th
                key={property.id}
                className={cn(
                  'p-3 text-center text-sm font-semibold',
                  idx === bestMatchIndex
                    ? 'bg-sky-50 dark:bg-sky-900/20'
                    : 'bg-gray-50 dark:bg-gray-800/50',
                  idx === properties.length - 1 && idx !== bestMatchIndex && 'rounded-tr-lg'
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  {idx === bestMatchIndex && (
                    <Badge variant="info" className="text-[10px] mb-1">
                      <Trophy size={10} className="mr-1" /> Best Match
                    </Badge>
                  )}
                  <span className="text-[#0f172a] dark:text-white truncate max-w-[140px]">
                    {property.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.label}
              className={cn(
                'border-t border-gray-100 dark:border-gray-800',
                rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
              )}
            >
              <td className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  {row.icon && <row.icon size={14} className="text-gray-400" />}
                  {row.label}
                </div>
              </td>
              {properties.map((property, idx) => {
                const value = row.render(property);
                const isAmenity = (row as any).isAmenity;
                return (
                  <td
                    key={property.id}
                    className={cn(
                      'p-3 text-center text-sm',
                      idx === bestMatchIndex && 'bg-sky-50/50 dark:bg-sky-900/10',
                      isAmenity && value === '✓' && 'text-green-600 dark:text-green-400 font-semibold',
                      isAmenity && value === '✕' && 'text-red-400 dark:text-red-500',
                      !isAmenity && 'text-[#0f172a] dark:text-gray-300'
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BuyerComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const navigate = useNavigate();

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['exploreSearch', searchQuery],
    queryFn: () =>
      buyerApi.explore({ search: searchQuery, limit: 10 }).then((res) => res.data.data?.items || []),
    enabled: searchQuery.length >= 2,
  });

  const { data: comparisonData, isLoading: isComparing } = useQuery({
    queryKey: ['compare', selectedIds],
    queryFn: () => buyerApi.compare(selectedIds).then((res) => res.data.data),
    enabled: selectedIds.length >= 2,
  });

  const toggleProperty = useCallback(
    (property: any) => {
      const idx = selectedIds.indexOf(property.id);
      if (idx >= 0) {
        setSelectedIds((prev) => prev.filter((id) => id !== property.id));
        setSelectedProperties((prev) => prev.filter((p) => p.id !== property.id));
      } else if (selectedIds.length < 4) {
        setSelectedIds((prev) => [...prev, property.id]);
        setSelectedProperties((prev) => [...prev, property]);
      }
    },
    [selectedIds]
  );

  const removeProperty = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
    setSelectedProperties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const comparisonProperties = useMemo(() => {
    if (comparisonData?.properties) return comparisonData.properties;
    if (selectedProperties.length >= 2) return selectedProperties;
    return [];
  }, [comparisonData, selectedProperties]);

  const bestMatchIndex = useMemo(() => {
    if (!comparisonProperties.length) return -1;
    let bestIdx = 0;
    let bestScore = -1;

    comparisonProperties.forEach((p: any, idx: number) => {
      let score = 0;
      const price = p.rooms?.[0]?.pricePerMonth || p.rooms?.[0]?.pricePerNight;
      if (price) score += Math.max(0, 100000 - Number(price)) / 1000;
      if (p.averageRating) score += Number(p.averageRating) * 10;
      p.amenities?.forEach(() => score += 5);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    return bestIdx;
  }, [comparisonProperties]);

  const isReady = selectedIds.length >= 2 && selectedIds.length <= 4;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Compare Properties</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Select 2-4 properties to compare side by side
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/buyer/explore')}
          className="hidden sm:flex"
        >
          <Search size={16} className="mr-2" />
          Search Properties
        </Button>
      </div>

      {/* Selected Chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProperties.map((property) => (
            <PropertyChip
              key={property.id}
              property={property}
              onRemove={() => removeProperty(property.id)}
            />
          ))}
          {selectedIds.length < 4 && (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:border-sky-400 hover:text-sky-500 transition-colors"
            >
              <Plus size={14} />
              Add more
            </button>
          )}
        </div>
      )}

      {/* Search Section */}
      {showSearch && selectedIds.length < 4 && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties by name, city, or area..."
                className="pl-10"
                autoFocus
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>
                ) : searchResults?.length > 0 ? (
                  searchResults.map((property: any) => (
                    <SearchResult
                      key={property.id}
                      property={property}
                      isSelected={selectedIds.includes(property.id)}
                      onToggle={() => toggleProperty(property)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">No properties found</div>
                )}
              </div>
            )}

            {selectedIds.length >= 4 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Maximum 4 properties can be compared
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {isReady && (
        <Card>
          <CardContent className="p-0">
            {isComparing ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mx-auto" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              </div>
            ) : (
              <ComparisonTable properties={comparisonProperties} bestMatchIndex={bestMatchIndex} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isReady && selectedIds.length < 2 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Scale size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#0f172a] dark:text-white mb-1">
            Select 2-4 properties to compare
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            Use the search above to find and add properties to compare their features, prices, and amenities.
          </p>
          <Button
            onClick={() => navigate('/buyer/explore')}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Search size={16} className="mr-2" />
            Browse Properties
          </Button>
        </div>
      )}
    </div>
  );
}
