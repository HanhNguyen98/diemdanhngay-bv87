import { AlarmClock, Baby, Home, Moon, Plane, Stethoscope } from 'lucide-react';
import { DiHocIcon } from '../components/shared/DiHocIcon';
import {
  IconBriefcase,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconEllipsis,
  IconX,
  IconXCircle,
} from '../components/icons/Icons';

function lucideIcon(Icon, strokeWidth = 2) {
  function Wrapped({ className = 'w-4 h-4', ...props }) {
    return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
  }
  return Wrapped;
}

export const IconBaby = lucideIcon(Baby);
export const IconSick = lucideIcon(Stethoscope);
export const IconLate = lucideIcon(AlarmClock, 2.5);
export const IconPlane = lucideIcon(Plane);
export const IconMoon = lucideIcon(Moon);
export const IconHome = lucideIcon(Home);

/** Icon KPI / badge / tile — map khớp icon_key trong catalog */
export const STATUS_KPI_ICON_MAP = {
  check: IconCheckCircle,
  x: IconXCircle,
  graduation: DiHocIcon,
  briefcase: IconBriefcase,
  clock: IconClock,
  plane: IconPlane,
  pending: IconEllipsis,
  baby: IconBaby,
  sick: IconSick,
  late: IconLate,
  moon: IconMoon,
  home: IconHome,
};

/** Icon nút Điểm danh nhanh (stroke mảnh hơn cho check/x) */
export const STATUS_QUICK_ICON_MAP = {
  check: IconCheck,
  x: IconX,
  graduation: DiHocIcon,
  briefcase: IconBriefcase,
  clock: IconClock,
  plane: IconPlane,
  pending: IconEllipsis,
  baby: IconBaby,
  sick: IconSick,
  late: IconLate,
  moon: IconMoon,
  home: IconHome,
};

export function resolveStatusKpiIcon(iconKey) {
  return STATUS_KPI_ICON_MAP[iconKey] || IconEllipsis;
}

export function resolveStatusQuickIcon(iconKey) {
  return STATUS_QUICK_ICON_MAP[iconKey] || IconCheck;
}
