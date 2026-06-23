import { DiHocIcon } from './DiHocIcon';
import {
  IconBriefcase,
  IconCheckCircle,
  IconClock,
  IconEllipsis,
  IconXCircle,
} from '../icons/Icons';
import { KPI_METRIC_ICON_SIZE } from '../../constants/attendance';
import { KPI_LABEL_CLASS_BY_COLOR } from '../../utils/statusBreakdown';
import { resolveStatusKpiIcon } from '../../utils/statusIcons';

export function StatusBreakdownIcon({
  iconKey,
  colorKey,
  className = KPI_METRIC_ICON_SIZE,
  variant = 'default',
}) {
  const Icon = resolveStatusKpiIcon(iconKey);
  const colorClass =
    variant === 'onColor'
      ? 'text-white'
      : iconKey === 'graduation'
        ? 'text-warning-dark'
        : iconKey === 'check'
          ? 'text-success-dark'
          : iconKey === 'x'
            ? 'text-danger-dark'
            : iconKey === 'briefcase'
              ? 'text-primary'
              : KPI_LABEL_CLASS_BY_COLOR[colorKey] || 'text-content-muted';
  return <Icon className={`${className} ${colorClass}`} aria-hidden="true" />;
}
