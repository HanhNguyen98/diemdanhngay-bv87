import { memo } from 'react';
import { Building2 } from 'lucide-react';

const AppLogo = memo(function AppLogo({
  logoUrl,
  className = 'w-9 h-9 rounded-lg object-cover',
  fallbackClassName = 'w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm',
  iconClassName = 'w-5 h-5',
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={className} />;
  }
  return (
    <div className={fallbackClassName}>
      <Building2 className={iconClassName} />
    </div>
  );
});

export default AppLogo;
