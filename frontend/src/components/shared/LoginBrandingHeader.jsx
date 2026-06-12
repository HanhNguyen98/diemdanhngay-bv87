import { memo } from 'react';
import AppLogo from './AppLogo';

const LoginBrandingHeader = memo(function LoginBrandingHeader({
  loginAvatarUrl,
  logoUrl,
  portalTitle,
  subtitle,
  compact = false,
  showHeroImage = true,
  showEmptyPlaceholder = false,
}) {
  const imageHeight = compact ? 'h-28' : 'h-44';

  return (
    <>
      {showHeroImage &&
        (loginAvatarUrl ? (
          <img
            src={loginAvatarUrl}
            alt=""
            className={`w-full ${imageHeight} object-cover`}
          />
        ) : showEmptyPlaceholder ? (
          <div className={`w-full ${imageHeight} bg-surface-page flex items-center justify-center`}>
            <p className="text-xs text-content-muted px-4 text-center">
              Chưa có ảnh đại diện màn đăng nhập
            </p>
          </div>
        ) : null)}

      <div className={`text-center ${compact ? 'px-4 py-3' : 'px-6 py-5'}`}>
        <div className="inline-flex mb-3">
          <AppLogo
            logoUrl={logoUrl}
            className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl object-contain`}
            fallbackClassName={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl bg-primary flex items-center justify-center text-white shadow-sm`}
            iconClassName={compact ? 'w-5 h-5' : 'w-7 h-7'}
          />
        </div>
        <h1
          className={`font-bold text-brand-title leading-tight ${
            compact ? 'text-sm' : 'text-2xl'
          }`}
        >
          {portalTitle}
        </h1>
        {subtitle && (
          <p
            className={`text-content-muted mt-1 ${
              compact ? 'text-3xs' : 'text-sm'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
});

export default LoginBrandingHeader;
