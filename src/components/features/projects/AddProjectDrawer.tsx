import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Stepper } from '@/components/patterns/Stepper'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAddProjectForm, validateStep, validateAll, type AddProjectValues } from './useAddProjectForm'
import { StepBasicInfo } from './StepBasicInfo'
import { StepAdditionalDetails } from './StepAdditionalDetails'

export interface AddProjectDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: AddProjectValues) => void
  canSeeFinancials?: boolean
  /** Edit mode prefills the form and changes copy; pass the row's known fields. */
  mode?: 'create' | 'edit'
  initialValues?: Partial<AddProjectValues>
  /** Jump straight to a step — used by Project Detail's per-section edit buttons. */
  initialStep?: number
}

export function AddProjectDrawer({
  open,
  onClose,
  onSubmit,
  canSeeFinancials = true,
  mode = 'create',
  initialValues,
  initialStep = 0,
}: AddProjectDrawerProps) {
  const isEdit = mode === 'edit'
  const form = useAddProjectForm(initialValues, initialStep)
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

  const handleSubmit = async () => {
    const e = isEdit ? validateAll(values, isEdit) : validateStep(step, values, isEdit)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    // Persistence is wired when the API lands; the flow is complete without it.
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    onSubmit?.(values)
    handleClose()
  }

  const stepProps = { values, errors, setField, canSeeFinancials }
  const title = isEdit && initialValues?.number
    ? `Edit project ${initialValues.number}-${initialValues.subNumber}`
    : 'Add new project'

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title={title}
        footer={
          isEdit ? (
            <>
              <Button variant="secondary" onClick={requestClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {step > 0 && (
                <Button variant="tertiary" onClick={back} leadingIcon={<ArrowLeft size={16} />}>
                  Back
                </Button>
              )}
              <Button variant="secondary" onClick={requestClose}>
                Cancel
              </Button>
              {isLastStep ? (
                <Button onClick={handleSubmit} loading={submitting}>
                  Create Project
                </Button>
              ) : (
                <Button onClick={next}>Continue</Button>
              )}
            </>
          )
        }
      >
        {/* Edit shows every section on one screen, like every other Edit
            drawer in the app (Cancel + Save Changes, no step navigation) —
            the stepper is only for progressively collecting a new record. */}
        {!isEdit && <Stepper steps={steps} current={step} />}

        {hasErrors && (
          <Alert title="Please complete the required fields">
            Fill in all fields marked with an asterisk (*) before {isEdit ? 'saving' : 'continuing'}.
          </Alert>
        )}

        {isEdit ? (
          <>
            <StepBasicInfo {...stepProps} />
            <StepAdditionalDetails {...stepProps} />
          </>
        ) : (
          <>
            {step === 0 && <StepBasicInfo {...stepProps} />}
            {step === 1 && <StepAdditionalDetails {...stepProps} />}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmClose}
        title={isEdit ? 'Discard these changes?' : 'Discard this project?'}
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
