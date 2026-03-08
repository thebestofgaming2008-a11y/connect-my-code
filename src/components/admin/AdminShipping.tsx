import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Save, Loader2, RotateCcw } from 'lucide-react';

interface ShippingZoneForm {
  id: string;
  name: string;
  base_rate_inr: number;
  free_shipping_threshold_inr: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

const DEFAULT_ZONES: ShippingZoneForm[] = [
  { id: 'india', name: 'India', base_rate_inr: 50, free_shipping_threshold_inr: 0, estimated_days_min: 3, estimated_days_max: 7 },
  { id: 'rest-of-world', name: 'Rest of World', base_rate_inr: 1000, free_shipping_threshold_inr: 0, estimated_days_min: 10, estimated_days_max: 21 },
];

const STORAGE_KEY = 'admin_shipping_zones';

function loadZones(): ShippingZoneForm[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_ZONES;
}

const AdminShipping = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<ShippingZoneForm[]>(loadZones);
  const [saving, setSaving] = useState(false);

  const updateZone = (id: string, field: keyof ShippingZoneForm, value: string | number) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
      toast({ title: 'Shipping rates saved', description: 'Changes are live immediately.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save shipping rates', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setZones(DEFAULT_ZONES);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: 'Reset to defaults' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Zones
          </h2>
          <p className="text-sm text-muted-foreground">Set shipping rates per region.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map(zone => (
          <Card key={zone.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{zone.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Base Rate (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={zone.base_rate_inr}
                  onChange={e => updateZone(zone.id, 'base_rate_inr', Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Days</Label>
                  <Input
                    type="number"
                    min={1}
                    value={zone.estimated_days_min}
                    onChange={e => updateZone(zone.id, 'estimated_days_min', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Days</Label>
                  <Input
                    type="number"
                    min={1}
                    value={zone.estimated_days_max}
                    onChange={e => updateZone(zone.id, 'estimated_days_max', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminShipping;
