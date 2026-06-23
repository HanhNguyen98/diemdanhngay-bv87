import { memo } from 'react';
import { GraduationCap } from 'lucide-react';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE } from '../../constants/attendance';

/** Nền kem + mũ vàng cam — chuẩn toàn hệ thống cho trạng thái Đi học */
export const DI_HOC_ICON_BG = 'bg-kpi-duty';
export const DI_HOC_ICON_COLOR = 'text-warning-fg';
export const DI_HOC_ICON_STROKE = 2;

export const DiHocIcon = memo(function DiHocIcon({
  className = 'h-4 w-4',
  strokeWidth = DI_HOC_ICON_STROKE,
  ...props
}) {
  return <GraduationCap className={className} strokeWidth={strokeWidth} {...props} />;
});

/** Icon KPI trong ô vuông bo góc (màn Điểm danh, thống kê, admin dashboard) */
export const DiHocKpiIcon = memo(function DiHocKpiIcon({
  boxClassName = `flex ${KPI_METRIC_ICON_BOX} shrink-0 items-center justify-center rounded-lg`,
  iconClassName = `${KPI_METRIC_ICON_SIZE} ${DI_HOC_ICON_COLOR}`,
}) {
  return (
    <div className={`${boxClassName} ${DI_HOC_ICON_BG}`} aria-hidden="true">
      <DiHocIcon className={iconClassName} />
    </div>
  );
});
