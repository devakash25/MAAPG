import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/utils/helpers';
import {
  MessageCircle,
  Clock,
  Calendar,
  Home,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'CLOSED', label: 'Closed' },
];

const statusVariant: Record<string, 'info' | 'warning' | 'success' | 'secondary' | 'destructive'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  CONVERTED: 'success',
  CLOSED: 'secondary',
};

const statusIcon: Record<string, any> = {
  NEW: Send,
  CONTACTED: Clock,
  CONVERTED: CheckCircle,
  CLOSED: XCircle,
};

export default function BuyerEnquiriesPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['buyerEnquiries', page, activeTab],
    queryFn: () =>
      buyerApi
        .getEnquiries({ page, limit: 10, status: activeTab || undefined })
        .then((res) => res.data),
  });

  const enquiries = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] dark:text-white">
          My Enquiries
        </h1>
        <p className="text-gray-500 text-sm">
          Track your property enquiries and their status
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setPage(1);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                No enquiries found
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab
                  ? 'No enquiries with this status'
                  : "You haven't made any enquiries yet. Browse properties and start a conversation."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {enquiries.map((enquiry: any) => {
                  const StatusIcon = statusIcon[enquiry.status] || Send;
                  return (
                    <div
                      key={enquiry.id}
                      className={cn(
                        'border rounded-xl p-4 transition-colors hover:bg-gray-50 dark:hover:bg-sky-900/10',
                        enquiry.status === 'NEW' &&
                          'border-sky-200 bg-sky-50/50 dark:border-sky-800/30'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Property Image */}
                        <div className="w-full sm:w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {enquiry.property?.images?.[0]?.url ? (
                            <img
                              src={enquiry.property.images[0].url}
                              alt={enquiry.property?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="font-semibold text-[#0f172a] dark:text-white truncate">
                              {enquiry.property?.name || 'Property'}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={statusVariant[enquiry.status] || 'secondary'}>
                                <StatusIcon size={12} className="mr-1" />
                                {enquiry.status}
                              </Badge>
                              {enquiry.property?.propertyType && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                                  {enquiry.property.propertyType.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {enquiry.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              Sent {formatDate(enquiry.createdAt)}
                            </span>
                            {enquiry.moveInDate && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Move-in: {formatDate(enquiry.moveInDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pagination && pagination.total > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t gap-3">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of{' '}
                    {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft size={14} className="mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
