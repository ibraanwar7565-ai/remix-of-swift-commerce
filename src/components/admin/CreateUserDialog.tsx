import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Bike, ShieldCheck, Package, Headphones, User, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'order_manager', 'inventory_manager', 'support', 'rider']),
  branchId: z.string().optional(),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const roleOptions = [
  { value: 'rider', label: 'Rider', icon: Bike, description: 'Delivery personnel' },
  { value: 'order_manager', label: 'Order Manager', icon: Package, description: 'Manages orders & assignments' },
  { value: 'inventory_manager', label: 'Inventory', icon: Package, description: 'Manages products & stock' },
  { value: 'support', label: 'Support', icon: Headphones, description: 'Customer support staff' },
  { value: 'admin', label: 'Branch Admin', icon: Store, description: 'Branch-level admin access' },
] as const;

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { branches } = useBranches();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: user?.email || '',
      phone: '',
      password: '',
      role: 'rider',
      branchId: '',
      vehicleType: 'motorcycle',
      licensePlate: '',
    },
  });

  useEffect(() => {
    if (open && user?.email) {
      form.setValue('email', user.email);
    }
  }, [open, user?.email]);

  const selectedRole = form.watch('role');

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          branchId: data.branchId || null,
          vehicleType: data.vehicleType,
          licensePlate: data.licensePlate,
        },
      });

      if (response.error) throw new Error(response.error.message || 'Failed to create user');
      if (response.data?.error) throw new Error(response.data.error);

      const branchName = data.branchId ? branches.find(b => b.id === data.branchId)?.name : null;
      toast({
        title: 'User created successfully',
        description: `${data.fullName} added as ${data.role.replace('_', ' ')}${branchName ? ` at ${branchName}` : ''}`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Create user error:', error);
      toast({
        title: 'Failed to create user',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => form.setValue('role', value as CreateUserFormData['role'])}
              className="grid grid-cols-2 gap-2"
            >
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <label
                    key={role.value}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={role.value} className="sr-only" />
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{role.label}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Branch Assignment */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to Branch</Label>
              <Select value={form.watch('branchId') || ''} onValueChange={(v) => form.setValue('branchId', v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a branch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {branches.filter(b => b.is_active).map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        {branch.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave empty for main/global access
              </p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" {...form.register('fullName')} className="mt-1 rounded-xl" />
              {form.formState.errors.fullName && <p className="text-sm text-destructive mt-1">{form.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...form.register('email')} className="mt-1 rounded-xl" />
              {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="0712345678" {...form.register('phone')} className="mt-1 rounded-xl" />
              {form.formState.errors.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...form.register('password')} className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>}
            </div>
          </div>

          {/* Rider-specific fields */}
          {selectedRole === 'rider' && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">Rider Details</p>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Input id="vehicleType" placeholder="Motorcycle, Bicycle, etc." {...form.register('vehicleType')} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate (optional)</Label>
                <Input id="licensePlate" placeholder="KAA 123X" {...form.register('licensePlate')} className="mt-1 rounded-xl" />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
            ) : (
              'Create User'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
