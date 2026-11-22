import { useState } from 'react';
import { DEFAULT_CATEGORIES, DEFAULT_HABIT_COLOR, DEFAULT_HABIT_ICON } from '@habit/shared';
import { PageHeader } from '../components/layout';
import {
  Badge,
  Button,
  Card,
  ColorPicker,
  ConfirmDialog,
  EmojiPicker,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Select,
  Spinner,
} from '../components/ui';
import { useToast } from '../context/useToast';
import { useDisclosure } from '../hooks/common/useDisclosure';
import styles from './PlaygroundPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

/**
 * Development-only page that shows every UI component in one place
 * (only routed when running `npm run dev`). Handy for checking styles and keyboard use.
 */
export function PlaygroundPage() {
  useDocumentTitle('UI playground');
  const { showToast } = useToast();
  const modal = useDisclosure();
  const confirm = useDisclosure();
  const [color, setColor] = useState<string>(DEFAULT_HABIT_COLOR);
  const [icon, setIcon] = useState<string>(DEFAULT_HABIT_ICON);

  return (
    <>
      <PageHeader title="UI playground" subtitle="Every reusable component (dev only)." />

      <div className={styles.grid}>
        <Card>
          <h2 className={styles.heading}>Buttons</h2>
          <div className={styles.row}>
            <Button leftIcon="plus">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" leftIcon="trash">
              Delete
            </Button>
            <Button loading>Saving</Button>
          </div>
          <div className={styles.row}>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <IconButton icon="edit" label="Edit" />
            <IconButton icon="trash" label="Delete" variant="danger" />
            <IconButton icon="more" label="More" variant="secondary" />
          </div>
        </Card>

        <Card>
          <h2 className={styles.heading}>Badges & spinner</h2>
          <div className={styles.row}>
            <Badge>Neutral</Badge>
            <Badge tone="primary">Primary</Badge>
            <Badge tone="success">🔥 12 days</Badge>
            <Badge tone="warning">2 / 3 this week</Badge>
            <Badge tone="danger">Missed</Badge>
            <Badge color="#ec4899">Health</Badge>
            <Spinner />
          </div>
        </Card>

        <Card>
          <h2 className={styles.heading}>Form controls</h2>
          <div className={styles.stack}>
            <Input label="Habit name" placeholder="e.g. Drink water" hint="Up to 60 characters." />
            <Input label="With an error" defaultValue="x" error="Name is too short" />
            <Select
              label="Category"
              placeholder="No category"
              options={DEFAULT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <ColorPicker value={color} onChange={setColor} />
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>
        </Card>

        <Card accentColor={color}>
          <h2 className={styles.heading}>{icon} Card with accent colour</h2>
          <p className={styles.muted}>The stripe uses the colour picked above.</p>
        </Card>

        <Card>
          <h2 className={styles.heading}>Modal, confirm & toasts</h2>
          <div className={styles.row}>
            <Button variant="secondary" onClick={modal.open}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={confirm.open}>
              Open confirm
            </Button>
            <Button variant="secondary" onClick={() => showToast('Habit saved', 'success')}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => showToast('Could not save', 'error')}>
              Error toast
            </Button>
          </div>
        </Card>

        <EmptyState
          icon="🌱"
          title="Empty state"
          description="Shown when there is nothing to display yet."
          action={<Button leftIcon="plus">Add habit</Button>}
        />
        <ErrorState message="The server did not respond." onRetry={() => showToast('Retrying…')} />
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="New habit"
        description="Modals trap focus and close with Esc or a click outside."
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                modal.close();
                showToast('Habit created', 'success');
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Input label="Habit name" placeholder="e.g. Read 20 pages" autoFocus />
      </Modal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title="Delete habit?"
        message="This removes the habit and all its history. This can't be undone."
        confirmLabel="Delete"
        danger
        onCancel={confirm.close}
        onConfirm={() => {
          confirm.close();
          showToast('Habit deleted', 'success');
        }}
      />
    </>
  );
}
