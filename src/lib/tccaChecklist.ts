import type { ChecklistPhase } from '@/types/project'

/**
 * Standard TCCA process checklist, grouped by phase. Same master list for
 * every TCCA project — the user ticks what is applicable, and records the
 * completion date later. Item names come from the client's existing form.
 */
export const TCCA_CHECKLIST: ChecklistPhase[] = [
  {
    id: 'application',
    title: 'Application, Cert Basis, MOC, LOI/LOS',
    items: [
      { id: 'major-minor', label: 'Major / Minor determination' },
      { id: 'ndwl-project', label: 'NDWL Project' },
      { id: 'tcca-loi', label: 'TCCA LOI' },
      { id: 'test-agree', label: 'Test Agreement' },
      { id: 'test-witness', label: 'Test Witnesses' },
    ],
  },
  {
    id: 'demonstrate-compliance',
    title: 'Demonstrate Compliance',
    items: [
      { id: 'soc', label: 'SOC' },
      { id: 'mdl-signed', label: 'MDL Signed' },
      { id: 'msi-53-signed', label: 'MSI 53 Signed' },
      { id: 'fms-signed', label: 'FMS Signed' },
      { id: 'tcca-foc', label: 'TCCA FOC' },
      { id: 'tcca-loi-compliance', label: 'TCCA LOI' },
    ],
  },
  {
    id: 'approval',
    title: 'Approval',
    items: [
      { id: 'doc', label: 'DOC: Declaration of Conformity' },
      { id: 'und', label: 'UND' },
      { id: 'cert-readiness', label: 'Cert Readiness' },
      { id: 'approval-doc-content', label: 'Approval Doc Content' },
      { id: 'final-tcca-stc', label: 'Final TCCA STC' },
    ],
  },
  {
    id: 'foreign-validation',
    title: 'Foreign Validation',
    items: [
      { id: 'foreign-val-appl', label: 'Foreign Validation Application' },
      { id: 'final-faa-stc', label: 'Final FAA STC' },
      { id: 'final-easa-stc', label: 'Final EASA STC' },
      { id: 'final-easa-minor', label: 'Final EASA Minor Approval' },
    ],
  },
  {
    id: 'closing',
    title: 'Closing Actions',
    items: [
      { id: 'upload-docs', label: 'Upload Docs' },
      { id: 'upload-open-docs', label: 'Upload Open Docs' },
      { id: 'ndwl-close', label: 'NDWL Close' },
      { id: 'pcc-closed', label: 'PCC Closed' },
    ],
  },
]
