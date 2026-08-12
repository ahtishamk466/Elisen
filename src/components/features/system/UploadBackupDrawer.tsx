import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { Button } from '@/components/ui/Button'

export interface UploadBackupDrawerProps {
  onClose: () => void
  onSave: (file: File) => void
}

/** The old standalone Upload page, as a drawer — heading and the drop zone,
    nothing else. No section card wrapping a single field. */
export function UploadBackupDrawer({ onClose, onSave }: UploadBackupDrawerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const submit = () => {
    if (!file) { setError('Choose a .sql backup file to upload.'); return }
    onSave(file)
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Upload Backup File"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </>
      }
    >
      <FileDropzone
        label="Upload File"
        required
        accept=".sql"
        hint="SQL backup files only (.sql)"
        file={file}
        error={error}
        onSelect={(f) => { setFile(f); setError(f ? '' : 'Choose a .sql backup file to upload.') }}
      />
    </Drawer>
  )
}
