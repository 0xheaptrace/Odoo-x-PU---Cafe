import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  message = 'Are you sure?',
  title = 'Confirm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="mb-6 text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
