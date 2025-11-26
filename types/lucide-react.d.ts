// Type declaration for lucide-react to help TypeScript resolve types
declare module 'lucide-react' {
  import type { RefAttributes, SVGProps } from 'react';
  
  export interface LucideProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'children'>, RefAttributes<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  
  export type LucideIcon = React.ForwardRefExoticComponent<LucideProps>;
  
  // Export all icons used in the codebase
  export const Plus: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const X: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const XIcon: LucideIcon;
  export const PanelLeftIcon: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const GripVerticalIcon: LucideIcon;
  export const CircleIcon: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const MinusIcon: LucideIcon;
  export const SearchIcon: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const Shield: LucideIcon;
  export const LogOut: LucideIcon;
  export const UserIcon: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Map: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Bell: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Clock: LucideIcon;
  export const BellOff: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const MapPin: LucideIcon;
  export const Activity: LucideIcon;
  export const Bot: LucideIcon;
  export const Send: LucideIcon;
  export const User: LucideIcon;
  export const Loader2: LucideIcon;
  export const Layers: LucideIcon;
  export const Filter: LucideIcon;
  export const MapPinIcon: LucideIcon;
  // Calendar icons
  export const ChevronLeft: LucideIcon;
  export const ChevronDown: LucideIcon;
}

