import { motion } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryHeaderProps {
  location: string;
  onLocationClick: () => void;
}

export function DeliveryHeader({ location, onLocationClick }: DeliveryHeaderProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-3">
      {/* Greeting */}
      <h1 className="text-2xl font-bold text-foreground">
        {t('hello')}, {firstName}!
      </h1>

      {/* Address Card */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onLocationClick}
        className="w-full flex items-start gap-3 p-3 rounded-xl bg-secondary shadow-soft text-left"
      >
        <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{location}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('manageAddresses')}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
      </motion.button>
    </div>
  );
}
