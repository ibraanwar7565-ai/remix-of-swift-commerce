import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Hash, StickyNote, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface DeliveryDetails {
  buildingName: string;
  houseNumber: string;
  floor: string;
  instructions: string;
}

interface DeliveryDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (details: DeliveryDetails) => void;
  address: string;
}

export function DeliveryDetailsSheet({ open, onOpenChange, onConfirm, address }: DeliveryDetailsSheetProps) {
  const [details, setDetails] = useState<DeliveryDetails>({
    buildingName: '',
    houseNumber: '',
    floor: '',
    instructions: '',
  });

  const handleConfirm = () => {
    if (!details.houseNumber.trim()) {
      return;
    }
    onConfirm(details);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85vh]">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold text-left">Delivery Details</SheetTitle>
          <p className="text-sm text-muted-foreground text-left">Help our rider find you easily</p>
        </SheetHeader>

        {/* Current Address */}
        <div className="px-5 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Navigation className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Delivering to</p>
              <p className="text-sm font-medium text-foreground truncate">{address}</p>
            </div>
          </motion.div>
        </div>

        <div className="px-5 space-y-4 pb-6 overflow-y-auto">
          {/* Building Name */}
          <div className="space-y-1.5">
            <Label htmlFor="building" className="text-sm font-medium">Building / Estate Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="building"
                placeholder="e.g. Greenview Apartments"
                className="h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-primary/20"
                value={details.buildingName}
                onChange={(e) => setDetails(prev => ({ ...prev, buildingName: e.target.value }))}
              />
            </div>
          </div>

          {/* House / Door Number */}
          <div className="space-y-1.5">
            <Label htmlFor="houseNumber" className="text-sm font-medium">
              House / Door Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="houseNumber"
                placeholder="e.g. A4, Room 12, Gate 3"
                className="h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-primary/20"
                value={details.houseNumber}
                onChange={(e) => setDetails(prev => ({ ...prev, houseNumber: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Floor */}
          <div className="space-y-1.5">
            <Label htmlFor="floor" className="text-sm font-medium">Floor (optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="floor"
                placeholder="e.g. Ground floor, 3rd floor"
                className="h-12 pl-10 rounded-xl bg-muted border-0 focus-visible:ring-primary/20"
                value={details.floor}
                onChange={(e) => setDetails(prev => ({ ...prev, floor: e.target.value }))}
              />
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="text-sm font-medium">Delivery Instructions (optional)</Label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="instructions"
                placeholder="e.g. Ring the bell, leave at the gate, call on arrival..."
                className="pl-10 min-h-[80px] rounded-xl bg-muted border-0 focus-visible:ring-primary/20 resize-none"
                value={details.instructions}
                onChange={(e) => setDetails(prev => ({ ...prev, instructions: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-5 border-t border-border/50">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full h-14 rounded-2xl text-base font-semibold"
              onClick={handleConfirm}
              disabled={!details.houseNumber.trim()}
            >
              Confirm Delivery Details
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
