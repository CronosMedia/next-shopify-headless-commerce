'use client'

import Link from 'next/link'

interface FilterLink {
  name: string;
  href: string;
}

interface FilterGroup {
  title: string;
  links: FilterLink[];
}

interface MegaFilterPanelProps {
  filterGroups: FilterGroup[];
}

export default function MegaFilterPanel({ filterGroups }: MegaFilterPanelProps) {
  return (
    <div className="absolute top-0 right-0 h-full bg-white shadow-lg p-6 z-40" style={{ width: '100vw' }}>
      <div className="max-w-6xl mx-auto">
        {filterGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{group.title}</h3>
            <div className="flex flex-wrap gap-3">
              {group.links.map((link, linkIndex) => (
                <Link
                  key={linkIndex}
                  href={link.href}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
