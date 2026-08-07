import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Stepper } from '@/components/patterns/Stepper'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAddProjectForm, validateStep, type AddProjectValues } from './useAddProjectForm'
import { StepBasicInfo } from './StepBasicInfo'
import { StepAdditionalDetails } from './StepAdditionalDetails'
import { StepTccaSetup } from './StepTccaSetup'

export interface AddProjectDrawerProps {
  open: boolean
  onClose: () => void
  onCreated?: (values: AddProjectValues) => void
  canSeeFinancials?: boolean
}

export function AddProjectDrawer({ open, onClose, onCreated, canSeeFinancials = true }: AddProjectDrawerProps) {
  const form = useAddProjectForm()
  const { values, errors, setErrors, step, steps, isLastStep, dirty, setField, next, back, reset } = form
  const [confirmClose, setConfirmClose] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasErrors = Object.values(errors).some(Boolean)

  const requestClose = () => (dirty ? setConfirmClose(true) : handleClose())

  const handleClose = () => {
    reset()
    setConfirmClose(false)
    onClose()
  }

  const handleCreate = async () => {
    const e = validateStep(step, values)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    // Persistence is wired when the API lands; the flow is complete without it.
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    onCreated?.(values)
    handleClose()
  }

  const stepProps = { values, errors, setField, canSeeFinancials }

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title="Add new project"
        footer={
          <>
            {step > 0 ? (
              <Button variant="tertiary" onClick={back} leadingIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={requestClose}>
                Cancel
              </Button>
              {isLastStep ? (
                <Button onClick={handleCreate} loading={submitting}>
                  Create Project
                </Button>
              ) : (
                <Button onClick={next}>Continue</Button>
              )}
            </div>
          </>
        }
      >
        <Stepper steps={steps} current={step} />

        {hasErrors && (
          <Alert title="Please complete the required fields">
            Fill in all fields marked with an asterisk (*) before continuing.
          </Alert>
        )}

        {step === 0 && <StepBasicInfo {...stepProps} />}
        {step === 1 && <StepAdditionalDetails {...stepProps} />}
        {step === 2 && <StepTccaSetup {...stepProps} />}
      </Drawer>

      <ConfirmDialog
        open={confirmClose}
        title="Discard this project?"
        description="Your changes haven't been saved. Closing now will discard everything you've entered."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  )
}
