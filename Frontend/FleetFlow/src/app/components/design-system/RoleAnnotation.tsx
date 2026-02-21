interface RoleAnnotationProps {
  roles: string[];
  className?: string;
}

export function RoleAnnotation({ roles, className = '' }: RoleAnnotationProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200 ${className}`}>
      {roles.join(' + ')}
    </span>
  );
}
