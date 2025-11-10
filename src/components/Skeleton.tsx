import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {skeletonElement}
        </div>
      ))}
    </>
  );
};

// Preset skeleton components
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card p-6 space-y-4">
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-6">
            <Skeleton variant="text" width="60%" height={20} className="mb-4" />
            <Skeleton variant="text" width="40%" height={32} />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="card p-6">
        <Skeleton variant="text" width="30%" height={24} className="mb-4" />
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
};
