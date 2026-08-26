import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const propertyTypes = [
  { value: 'HOTEL', label: 'Hotel', icon: '🏨' },
  { value: 'HOSTEL', label: 'Hostel', icon: '🏢' },
  { value: 'PG', label: 'PG / Paying Guest', icon: '🛏️' },
  { value: 'RENTAL_ROOM', label: 'Room for Rent', icon: '🏠' },
  { value: 'APARTMENT', label: 'Apartment', icon: '🏢' },
  { value: 'GUEST_HOUSE', label: 'Guest House', icon: '🏡' },
];

const commonAmenities = [
  'WiFi', 'AC', 'Hot Water', 'Parking', 'Laundry', 'Kitchen', 'TV',
  'Power Backup', 'CCTV', 'Security', 'Lift', 'Gym', 'Swimming Pool',
  'Room Service', 'Housekeeping', 'Breakfast', 'Meals Included',
];

export default function AddPropertyPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    propertyType: '',
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPhone: '',
    contactEmail: '',
    amenities: [] as string[],
    rules: [] as string[],
    checkInTime: '14:00',
    checkOutTime: '11:00',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ownerApi.createProperty(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ownerProperties'] });
      addToast('Property created successfully', 'success');
      navigate(`/owner/properties/${res.data.data.id}`);
    },
    onError: () => addToast('Failed to create property', 'error'),
  });

  const totalSteps = 4;

  const handleSubmit = () => {
    createMutation.mutate({
      propertyType: formData.propertyType,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      amenities: formData.amenities.map(a => ({ name: a })),
      rules: formData.rules,
    });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Add New Property</h1>
          <p className="text-gray-500 text-sm">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-sky-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      {/* Step 1: Property Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What are you listing?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propertyTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, propertyType: type.value })}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-sky-500 ${
                    formData.propertyType === type.value
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-medium text-sm mt-2">{type.label}</p>
                  {formData.propertyType === type.value && (
                    <Check size={16} className="text-sky-500 mt-1" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Basic Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Sunrise PG" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Describe your property..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone *</label>
                <Input value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Email</label>
                <Input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="property@example.com" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Address *</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State *</label>
                <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pincode *</label>
                <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} placeholder="Pincode" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Amenities & Rules */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.amenities.includes(amenity)
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-300'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Property Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.rules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={rule} onChange={(e) => {
                    const newRules = [...formData.rules];
                    newRules[i] = e.target.value;
                    setFormData({ ...formData, rules: newRules });
                  }} placeholder="e.g. No smoking" />
                  <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, rules: formData.rules.filter((_, j) => j !== i) })}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, rules: [...formData.rules, ''] })}>
                + Add Rule
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
          <ChevronLeft size={16} className="mr-2" /> Back
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)}>
            Next <ChevronRight size={16} className="ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.propertyType || !formData.name}>
            {createMutation.isPending ? 'Creating...' : 'Create Property'}
          </Button>
        )}
      </div>
    </div>
  );
}
