"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  EditUser02Icon,
  Key01Icon,
  MoreVerticalIcon,
  UserBlock01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  changeUserPasswordAction,
  createUserAction,
  deleteUserAction,
  toggleUserAction,
  updateUserAction,
} from "./actions";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

const ROLE_META: Record<UserRole, { label: string; description: string }> = {
  admin: { label: "Administrador", description: "Acesso total" },
  dentist: { label: "Dentista", description: "Atendimento clínico" },
  assistant: { label: "Assistente", description: "Operação e agenda" },
};

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserSummary[];
  currentUserId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserSummary | null>(null);
  const activeUsers = users.filter((user) => user.isActive).length;
  const activeAdmins = users.filter(
    (user) => user.role === "admin" && user.isActive
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuários</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Gerencie quem pode acessar a clínica e o nível de permissão de cada pessoa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
          Novo usuário
        </button>
      </header>

      <section aria-labelledby="users-list-title" className="overflow-hidden rounded-md border border-border">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-secondary/35 px-4 py-2.5">
          <div>
            <h2 id="users-list-title" className="text-sm font-semibold text-foreground">
              Equipe com acesso
            </h2>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {users.length} {users.length === 1 ? "usuário" : "usuários"}
            </p>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {activeUsers} {activeUsers === 1 ? "ativo" : "ativos"}
          </span>
        </div>

        {users.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum usuário cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie o primeiro acesso para começar.
            </p>
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_8rem_2.5rem] gap-4 border-b border-border px-4 py-2.5 md:grid">
              <ColumnLabel>Usuário</ColumnLabel>
              <ColumnLabel>Perfil</ColumnLabel>
              <ColumnLabel>Status</ColumnLabel>
              <span aria-hidden="true" />
            </div>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrent={user.id === currentUserId}
                activeAdmins={activeAdmins}
                onEdit={() => setEditingUser(user)}
                onChangePassword={() => setPasswordUser(user)}
              />
            ))}
          </div>
        )}
      </section>

      <CreateUserSheet open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserSheet
        user={editingUser}
        currentUserId={currentUserId}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      />
      <PasswordUserSheet
        user={passwordUser}
        onOpenChange={(open) => {
          if (!open) setPasswordUser(null);
        }}
      />
    </div>
  );
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function UserRow({
  user,
  isCurrent,
  activeAdmins,
  onEdit,
  onChangePassword,
}: {
  user: UserSummary;
  isCurrent: boolean;
  activeAdmins: number;
  onEdit: () => void;
  onChangePassword: () => void;
}) {
  const role = ROLE_META[user.role];
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article
      className={cn(
        "relative grid min-w-0 gap-3 border-b border-border px-4 py-3.5 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_8rem_2.5rem] md:items-center md:gap-4",
        !user.isActive && "bg-muted/20"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs font-semibold text-muted-foreground",
            !user.isActive && "opacity-65"
          )}
        >
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className={cn("truncate text-sm font-semibold text-foreground", !user.isActive && "text-muted-foreground")}>
              {user.name}
            </h3>
            {isCurrent && (
              <span className="rounded-sm bg-primary/8 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">
                Você
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="ml-12 min-w-0 md:ml-0">
        <p className="text-sm font-medium text-foreground">{role.label}</p>
        <p className="text-xs text-muted-foreground">{role.description}</p>
      </div>

      <div className="ml-12 flex items-center gap-2 md:ml-0">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            user.isActive ? "bg-success" : "bg-muted-foreground/50"
          )}
        />
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          {user.isActive ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="absolute right-4 mt-0 md:static md:mt-0">
        <UserActions
          user={user}
          isCurrent={isCurrent}
          activeAdmins={activeAdmins}
          onEdit={onEdit}
          onChangePassword={onChangePassword}
        />
      </div>
    </article>
  );
}

function UserActions({
  user,
  isCurrent,
  activeAdmins,
  onEdit,
  onChangePassword,
}: {
  user: UserSummary;
  isCurrent: boolean;
  activeAdmins: number;
  onEdit: () => void;
  onChangePassword: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isLastActiveAdmin = user.role === "admin" && user.isActive && activeAdmins <= 1;

  function toggleAccess() {
    startTransition(async () => {
      const result = await toggleUserAction(user.id, !user.isActive);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(user.isActive ? "Acesso inativado." : "Acesso ativado.");
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDeleteOpen(false);
      toast.success("Usuário excluído.");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={pending}
            aria-label={`Ações de ${user.name}`}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={1.8} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={onEdit}>
            <HugeiconsIcon icon={EditUser02Icon} />
            Editar usuário
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onChangePassword}>
            <HugeiconsIcon icon={Key01Icon} />
            Alterar senha
          </DropdownMenuItem>
          {!isCurrent && (
            <>
              <DropdownMenuSeparator />
              {isLastActiveAdmin ? (
                <DropdownMenuItem disabled>
                  <HugeiconsIcon icon={UserCheck01Icon} />
                  Manter ao menos 1 admin
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={toggleAccess}>
                  <HugeiconsIcon icon={user.isActive ? UserBlock01Icon : UserCheck01Icon} />
                  {user.isActive ? "Inativar acesso" : "Ativar acesso"}
                </DropdownMenuItem>
              )}
              {!user.isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    <HugeiconsIcon icon={Delete02Icon} />
                    Excluir usuário
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <div>
            <AlertDialogTitle>Excluir {user.name}?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5">
              O acesso de {user.email} será removido definitivamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {pending ? "Excluindo…" : "Excluir usuário"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditUserSheet({
  user,
  currentUserId,
  onOpenChange,
}: {
  user: UserSummary | null;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const userId = user.id;
  const isCurrent = user.id === currentUserId;

  function handleOpenChange(open: boolean) {
    if (!open) setError(null);
    onOpenChange(open);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateUserAction(userId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      toast.success("Dados do usuário atualizados.");
      router.refresh();
    });
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar usuário</SheetTitle>
          <SheetDescription>
            Atualize os dados de acesso de {user.name}.
          </SheetDescription>
        </SheetHeader>

        <form
          key={user.id}
          action={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <Field label="Nome" htmlFor="edit-user-name">
            <input
              id="edit-user-name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              defaultValue={user.name}
              className={inputClassName}
            />
          </Field>

          <Field label="E-mail" htmlFor="edit-user-email">
            <input
              id="edit-user-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              defaultValue={user.email}
              className={inputClassName}
            />
          </Field>

          <Field label="Perfil" htmlFor="edit-user-role">
            {isCurrent && <input type="hidden" name="role" value={user.role} />}
            <select
              id="edit-user-role"
              name={isCurrent ? undefined : "role"}
              defaultValue={user.role}
              disabled={isCurrent}
              className={inputClassName}
            >
              <option value="assistant">Assistente · operação e agenda</option>
              <option value="dentist">Dentista · atendimento clínico</option>
              <option value="admin">Administrador · acesso total</option>
            </select>
            {isCurrent && (
              <p className="text-xs leading-5 text-muted-foreground">
                Seu perfil deve ser alterado por outro administrador.
              </p>
            )}
          </Field>

          {error && <ActionError>{error}</ActionError>}

          <SheetFooter className="-mx-4 -mb-4 mt-auto border-t border-border p-4">
            <div className="flex w-full justify-end gap-2">
              <SheetClose asChild>
                <button
                  type="button"
                  disabled={pending}
                  className={secondaryButtonClassName}
                >
                  Cancelar
                </button>
              </SheetClose>
              <button
                type="submit"
                disabled={pending}
                className={primaryButtonClassName}
              >
                {pending ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PasswordUserSheet({
  user,
  onOpenChange,
}: {
  user: UserSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const userId = user.id;

  function handleOpenChange(open: boolean) {
    if (!open) setError(null);
    onOpenChange(open);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await changeUserPasswordAction(userId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      toast.success("Senha atualizada. As outras sessões foram encerradas.");
      router.refresh();
    });
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Alterar senha</SheetTitle>
          <SheetDescription>
            Defina uma nova senha para {user.name}.
          </SheetDescription>
        </SheetHeader>

        <form
          key={user.id}
          action={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <Field label="Nova senha" htmlFor="change-user-password">
            <input
              id="change-user-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              className={inputClassName}
            />
          </Field>

          <Field label="Confirmar nova senha" htmlFor="change-user-password-confirmation">
            <input
              id="change-user-password-confirmation"
              name="passwordConfirmation"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              className={inputClassName}
            />
          </Field>

          <p className="text-xs leading-5 text-muted-foreground">
            Por segurança, as outras sessões deste usuário serão encerradas.
          </p>

          {error && <ActionError>{error}</ActionError>}

          <SheetFooter className="-mx-4 -mb-4 mt-auto border-t border-border p-4">
            <div className="flex w-full justify-end gap-2">
              <SheetClose asChild>
                <button
                  type="button"
                  disabled={pending}
                  className={secondaryButtonClassName}
                >
                  Cancelar
                </button>
              </SheetClose>
              <button
                type="submit"
                disabled={pending}
                className={primaryButtonClassName}
              >
                {pending ? "Alterando…" : "Alterar senha"}
              </button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CreateUserSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      toast.success("Usuário criado.");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Novo usuário</SheetTitle>
          <SheetDescription>
            Crie um acesso individual e defina o perfil de permissão.
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Field label="Nome" htmlFor="new-user-name">
            <input
              id="new-user-name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder="Nome completo"
              className={inputClassName}
            />
          </Field>

          <Field label="E-mail" htmlFor="new-user-email">
            <input
              id="new-user-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="nome@clinica.com.br"
              className={inputClassName}
            />
          </Field>

          <Field label="Senha temporária" htmlFor="new-user-password">
            <input
              id="new-user-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              className={inputClassName}
            />
          </Field>

          <Field label="Perfil" htmlFor="new-user-role">
            <select
              id="new-user-role"
              name="role"
              defaultValue="assistant"
              className={inputClassName}
            >
              <option value="assistant">Assistente · operação e agenda</option>
              <option value="dentist">Dentista · atendimento clínico</option>
              <option value="admin">Administrador · acesso total</option>
            </select>
          </Field>

          {error && <ActionError>{error}</ActionError>}

          <SheetFooter className="-mx-4 -mb-4 mt-auto border-t border-border p-4">
            <div className="flex w-full justify-end gap-2">
              <SheetClose asChild>
                <button
                  type="button"
                  disabled={pending}
                  className={secondaryButtonClassName}
                >
                  Cancelar
                </button>
              </SheetClose>
              <button
                type="submit"
                disabled={pending}
                className={primaryButtonClassName}
              >
                {pending ? "Criando…" : "Criar usuário"}
              </button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/35 bg-destructive/8 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const primaryButtonClassName =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
