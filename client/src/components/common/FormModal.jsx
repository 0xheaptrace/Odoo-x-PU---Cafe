import Modal from './Modal'
import Button from './Button'

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  size = 'md',
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(e)
        }}
      >
        {children}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
