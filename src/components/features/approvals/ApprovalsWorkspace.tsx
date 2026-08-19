import { useSearchParams } from 'react-router-dom'
import { ApprovalsPage } from './ApprovalsPage'
import { ApprovalRevisionsPage } from './ApprovalRevisionsPage'

/** One route for both listings; `?tab=revisions` picks the second, exactly as
    `?tab=serials` does on Aircraft. */
export function ApprovalsWorkspace() {
  const [searchParams] = useSearchParams()
  return searchParams.get('tab') === 'revisions' ? <ApprovalRevisionsPage /> : <ApprovalsPage />
}
