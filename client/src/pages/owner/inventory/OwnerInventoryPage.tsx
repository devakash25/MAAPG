import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Bed, Home, BedDouble, ToggleLeft, ToggleRight, Plus, Search, Trash2, Edit } from 'lucide-react';

export default function OwnerInventoryPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState('');
  const [search, setSearch] = useState('');
  const [addRoomModal, setAddRoomModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: '', roomType: 'SHARED', bedType: 'SINGLE', pricePerNight: 0, pricePerMonth: 0,
    totalBeds: 1, isAC: false, hasAttachedBathroom: false, isFurnished: false,
  });

  const { data: properties } = useQuery({
    queryKey: ['ownerProperties'],
    queryFn: () => ownerApi.getProperties({ limit: 100 }).then(res => res.data.data),
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['ownerInventory', selectedProperty],
    queryFn: () => ownerApi.getInventory({ propertyId: selectedProperty || undefined }).then(res => res.data.data),
  });

  const toggleBedMutation = useMutation({
    mutationFn: (bedId: string) => ownerApi.toggleBed(bedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerInventory'] });
      addToast('Bed status updated', 'success');
    },
    onError: () => addToast('Failed to update bed', 'error'),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => ownerApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerInventory'] });
      addToast('Room deleted', 'success');
      setDeleteModal(null);
    },
    onError: () => addToast('Failed to delete room', 'error'),
  });

  const createRoomMutation = useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: any }) => ownerApi.createRoom(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerInventory'] });
      addToast('Room created', 'success');
      setAddRoomModal(false);
      setNewRoom({ name: '', roomType: 'SHARED', bedType: 'SINGLE', pricePerNight: 0, pricePerMonth: 0, totalBeds: 1, isAC: false, hasAttachedBathroom: false, isFurnished: false });
    },
    onError: () => addToast('Failed to create room', 'error'),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ownerApi.updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerInventory'] });
      addToast('Room updated', 'success');
      setEditModal(null);
    },
    onError: () => addToast('Failed to update room', 'error'),
  });

  const rooms = inventory?.rooms || [];
  const stats = inventory?.stats || { totalRooms: 0, totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };

  const filteredRooms = rooms.filter((r: any) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.property?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Rooms & Inventory</h1>
          <p className="text-gray-500 text-sm">Manage rooms and bed availability across properties</p>
        </div>
        <Button onClick={() => setAddRoomModal(true)} disabled={!selectedProperty} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Add Room
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Rooms', value: stats.totalRooms, icon: Home, color: 'bg-sky-100 text-sky-700' },
          { label: 'Total Beds', value: stats.totalBeds, icon: BedDouble, color: 'bg-purple-100 text-purple-700' },
          { label: 'Available', value: stats.availableBeds, icon: Bed, color: 'bg-green-100 text-green-700' },
          { label: 'Occupied', value: stats.occupiedBeds, icon: Bed, color: 'bg-orange-100 text-orange-700' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className={cn(
                "px-4 py-2 border rounded-lg text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                'bg-white'
              )}
            >
              <option value="">All Properties</option>
              {properties?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <Bed size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No rooms found</p>
              {!selectedProperty && <p className="text-sm text-gray-400 mt-1">Select a property to view rooms</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((room: any) => (
                <div key={room.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{room.name}</h4>
                        <Badge variant="secondary">{room.roomType}</Badge>
                        <Badge variant={room.isActive !== false ? 'success' : 'destructive'}>
                          {room.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{room.property?.name}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span>{room.bedType} bed</span>
                        {room.pricePerNight > 0 && <span>{formatCurrency(room.pricePerNight)}/night</span>}
                        {room.pricePerMonth > 0 && <span>{formatCurrency(room.pricePerMonth)}/month</span>}
                        <span>{room.availableBeds}/{room.totalBeds} beds available</span>
                        {room.isAC && <span>AC</span>}
                        {room.hasAttachedBathroom && <span>Attached Bath</span>}
                        {room.isFurnished && <span>Furnished</span>}
                      </div>
                      {/* Beds */}
                      {room.beds && room.beds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {room.beds.map((bed: any) => (
                            <button
                              key={bed.id}
                              onClick={() => toggleBedMutation.mutate(bed.id)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                bed.isAvailable
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              )}
                              title={`Click to toggle ${bed.name}`}
                            >
                              {bed.isAvailable ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              {bed.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/properties/${room.propertyId}`)}>
                        <Home size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditModal(room)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteModal(room.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Modal */}
      <Modal
        isOpen={addRoomModal}
        onClose={() => setAddRoomModal(false)}
        title="Add New Room"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddRoomModal(false)}>Cancel</Button>
            <Button onClick={() => selectedProperty && createRoomMutation.mutate({ propertyId: selectedProperty, data: newRoom })} disabled={!newRoom.name || createRoomMutation.isPending}>
              {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <input type="text" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g. Room 101" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Type</label>
              <select value={newRoom.roomType} onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                <option value="SHARED">Shared</option>
                <option value="PRIVATE">Private</option>
                <option value="DORMITORY">Dormitory</option>
                <option value="SUITE">Suite</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bed Type</label>
              <select value={newRoom.bedType} onChange={(e) => setNewRoom({ ...newRoom, bedType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
                <option value="TWIN">Twin</option>
                <option value="BUNK">Bunk</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price/Night</label>
              <input type="number" value={newRoom.pricePerNight} onChange={(e) => setNewRoom({ ...newRoom, pricePerNight: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price/Month</label>
              <input type="number" value={newRoom.pricePerMonth} onChange={(e) => setNewRoom({ ...newRoom, pricePerMonth: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Beds</label>
            <input type="number" min="1" max="20" value={newRoom.totalBeds} onChange={(e) => setNewRoom({ ...newRoom, totalBeds: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'isAC', label: 'AC' },
              { key: 'hasAttachedBathroom', label: 'Attached Bathroom' },
              { key: 'isFurnished', label: 'Furnished' },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(newRoom as any)[opt.key]} onChange={(e) => setNewRoom({ ...newRoom, [opt.key]: e.target.checked })} className="w-4 h-4 text-sky-500 rounded" />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Edit Room Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit Room"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button onClick={() => editModal && updateRoomMutation.mutate({ id: editModal.id, data: { name: editModal.name, roomType: editModal.roomType, bedType: editModal.bedType, pricePerNight: editModal.pricePerNight, pricePerMonth: editModal.pricePerMonth, totalBeds: editModal.totalBeds, isAC: editModal.isAC, hasAttachedBathroom: editModal.hasAttachedBathroom, isFurnished: editModal.isFurnished } })} disabled={updateRoomMutation.isPending}>
              {updateRoomMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        {editModal && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Name</label>
              <input type="text" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Type</label>
                <select value={editModal.roomType} onChange={(e) => setEditModal({ ...editModal, roomType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                  <option value="SHARED">Shared</option>
                  <option value="PRIVATE">Private</option>
                  <option value="DORMITORY">Dormitory</option>
                  <option value="SUITE">Suite</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bed Type</label>
                <select value={editModal.bedType} onChange={(e) => setEditModal({ ...editModal, bedType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="TWIN">Twin</option>
                  <option value="BUNK">Bunk</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price/Night (₹)</label>
                <input type="number" min="0" value={editModal.pricePerNight} onChange={(e) => setEditModal({ ...editModal, pricePerNight: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price/Month (₹)</label>
                <input type="number" min="0" value={editModal.pricePerMonth} onChange={(e) => setEditModal({ ...editModal, pricePerMonth: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Beds</label>
              <input type="number" min="1" max="20" value={editModal.totalBeds} onChange={(e) => setEditModal({ ...editModal, totalBeds: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'isAC', label: 'AC' },
                { key: 'hasAttachedBathroom', label: 'Attached Bathroom' },
                { key: 'isFurnished', label: 'Furnished' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(editModal as any)[opt.key]} onChange={(e) => setEditModal({ ...editModal, [opt.key]: e.target.checked })} className="w-4 h-4 text-sky-500 rounded" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Room"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteModal && deleteRoomMutation.mutate(deleteModal)}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this room? All associated beds will also be removed.</p>
      </Modal>
    </div>
  );
}
