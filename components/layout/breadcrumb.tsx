'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

const BRAND = 'Lia';

// Singular de las colecciones, para mostrar un label legible en las rutas de
// detalle (/pacientes/[id]) en vez del id crudo.
const SINGULAR: Record<string, string> = {
  pacientes: 'Paciente',
  orcamentos: 'Orçamento',
  receitas: 'Receita',
  atestados: 'Atestado',
  usuarios: 'Usuário',
  catalogo: 'Item',
};

function isId(segment: string): boolean {
  return /^[a-z0-9]{20,}$/i.test(segment);
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href: string }[] = [
    { label: BRAND, href: '/agenda' },
  ];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = isId(segment)
      ? SINGULAR[segments[index - 1]] ?? 'Detalhe'
      : segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    crumbs.push({ label, href });
  });

  return (
    <nav aria-label="Navegação" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${index}-${crumb.href}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={12}
                strokeWidth={1.5}
                className="text-muted-foreground"
              />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
