import { Breadcrumb } from '@/components/layout/breadcrumb';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationTrigger } from '@/components/layout/notification-trigger';
import { LiaToggle } from '@/components/layout/lia-toggle';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-6"
    >
      <Breadcrumb />
      <div className="flex items-center gap-3">
        <LiaToggle />
        <NotificationTrigger />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
