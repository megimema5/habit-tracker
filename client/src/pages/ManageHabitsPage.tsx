import { useMemo, useState } from 'react';
import type { HabitWithStats } from '@habit/shared';
import { PageHeader } from '../components/layout';
import { CategoryFilter, HabitFormModal, HabitList } from '../components/habits';
import { Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useDisclosure } from '../hooks/common/useDisclosure';
import { useHabits } from '../hooks/habits/useHabits';
import { useDeleteHabit } from '../hooks/habits/useHabitMutations';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

/** Create, edit, delete and filter habits. */
export function ManageHabitsPage() {
  useDocumentTitle('Habits');
  const { data: habits, isPending, isError, refetch } = useHabits();
  const deleteHabit = useDeleteHabit();
  const form = useDisclosure();
  const [editing, setEditing] = useState<HabitWithStats | null>(null);
  const [deleting, setDeleting] = useState<HabitWithStats | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      [
        ...new Set((habits ?? []).map((h) => h.category).filter((c): c is string => Boolean(c))),
      ].sort(),
    [habits],
  );
  const visible = category ? (habits ?? []).filter((h) => h.category === category) : (habits ?? []);

  function openCreate() {
    setEditing(null);
    form.open();
  }

  function openEdit(habit: HabitWithStats) {
    setEditing(habit);
    form.open();
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteHabit.mutateAsync({ id: deleting.id, name: deleting.name });
      if (category && !habits?.some((h) => h.id !== deleting.id && h.category === category)) {
        setCategory(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Create, edit and organise your habits."
        actions={
          <Button leftIcon="plus" onClick={openCreate}>
            New habit
          </Button>
        }
      />

      {isPending && (
        <div aria-busy="true" aria-label="Loading habits">
          <Skeleton height={220} />
        </div>
      )}

      {isError && (
        <ErrorState message="Your habits could not be loaded." onRetry={() => void refetch()} />
      )}

      {habits && habits.length === 0 && (
        <EmptyState
          icon="📋"
          title="No habits yet"
          description="Add your first habit — daily, weekly or on specific days."
          action={
            <Button leftIcon="plus" onClick={openCreate}>
              Create a habit
            </Button>
          }
        />
      )}

      {habits && habits.length > 0 && (
        <>
          {categories.length > 0 && (
            <CategoryFilter categories={categories} value={category} onChange={setCategory} />
          )}
          <HabitList habits={visible} onEdit={openEdit} onDelete={setDeleting} />
        </>
      )}

      <HabitFormModal isOpen={form.isOpen} onClose={form.close} habit={editing} />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={`Delete “${deleting?.name ?? ''}”?`}
        message="This removes the habit and all of its history. This can't be undone."
        confirmLabel="Delete habit"
        danger
        loading={deleteHabit.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
