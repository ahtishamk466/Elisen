import type { Meta, StoryObj } from '@storybook/react'

interface SwatchDef {
  colorClass: string
  step: string
  rgba: string
  hsla: string
  hex: string
}

const PRIMARY: SwatchDef[] = [
  { colorClass: 'bg-primary-25',  step: '25',  rgba: 'rgba(237,245,255,1)', hsla: 'hsla(213,100,96,1)', hex: '#EDF5FF' },
  { colorClass: 'bg-primary-50',  step: '50',  rgba: 'rgba(204,221,241,1)', hsla: 'hsla(212,57,87,1)',  hex: '#CCDDF1' },
  { colorClass: 'bg-primary-100', step: '100', rgba: 'rgba(170,198,231,1)', hsla: 'hsla(212,56,79,1)',  hex: '#AAC6E7' },
  { colorClass: 'bg-primary-200', step: '200', rgba: 'rgba(127,169,219,1)', hsla: 'hsla(213,56,68,1)',  hex: '#7FA9DB' },
  { colorClass: 'bg-primary-300', step: '300', rgba: 'rgba(85,141,207,1)',  hsla: 'hsla(212,56,57,1)',  hex: '#558DCF' },
  { colorClass: 'bg-primary-400', step: '400', rgba: 'rgba(43,113,195,1)',  hsla: 'hsla(212,64,47,1)',  hex: '#2B71C3' },
  { colorClass: 'bg-primary-500', step: '500', rgba: 'rgba(0,84,183,1)',    hsla: 'hsla(212,100,36,1)', hex: '#0054B7' },
  { colorClass: 'bg-primary-600', step: '600', rgba: 'rgba(0,70,152,1)',    hsla: 'hsla(212,100,30,1)', hex: '#004698' },
  { colorClass: 'bg-primary-700', step: '700', rgba: 'rgba(0,56,122,1)',    hsla: 'hsla(212,100,24,1)', hex: '#00387A' },
  { colorClass: 'bg-primary-800', step: '800', rgba: 'rgba(0,42,92,1)',     hsla: 'hsla(213,100,18,1)', hex: '#002A5C' },
  { colorClass: 'bg-primary-900', step: '900', rgba: 'rgba(0,28,61,1)',     hsla: 'hsla(212,100,12,1)', hex: '#001C3D' },
  { colorClass: 'bg-primary-950', step: '950', rgba: 'rgba(0,17,37,1)',     hsla: 'hsla(212,100,7,1)',  hex: '#001125' },
]

const NEUTRAL: SwatchDef[] = [
  { colorClass: 'bg-neutral-25',  step: '25',  rgba: 'rgba(255,255,255,1)', hsla: 'hsla(0,0,100,1)',    hex: '#FFFFFF' },
  { colorClass: 'bg-neutral-50',  step: '50',  rgba: 'rgba(248,250,252,1)', hsla: 'hsla(210,40,98,1)',  hex: '#F8FAFC' },
  { colorClass: 'bg-neutral-100', step: '100', rgba: 'rgba(241,245,249,1)', hsla: 'hsla(210,40,96,1)',  hex: '#F1F5F9' },
  { colorClass: 'bg-neutral-200', step: '200', rgba: 'rgba(226,232,240,1)', hsla: 'hsla(214,32,91,1)',  hex: '#E2E8F0' },
  { colorClass: 'bg-neutral-300', step: '300', rgba: 'rgba(203,213,225,1)', hsla: 'hsla(213,27,84,1)',  hex: '#CBD5E1' },
  { colorClass: 'bg-neutral-400', step: '400', rgba: 'rgba(148,163,184,1)', hsla: 'hsla(215,20,65,1)',  hex: '#94A3B8' },
  { colorClass: 'bg-neutral-500', step: '500', rgba: 'rgba(100,116,139,1)', hsla: 'hsla(215,16,47,1)',  hex: '#64748B' },
  { colorClass: 'bg-neutral-600', step: '600', rgba: 'rgba(71,85,105,1)',   hsla: 'hsla(215,19,35,1)',  hex: '#475569' },
  { colorClass: 'bg-neutral-700', step: '700', rgba: 'rgba(51,65,85,1)',    hsla: 'hsla(215,25,27,1)',  hex: '#334155' },
  { colorClass: 'bg-neutral-800', step: '800', rgba: 'rgba(30,41,59,1)',    hsla: 'hsla(217,33,17,1)',  hex: '#1E293B' },
  { colorClass: 'bg-neutral-900', step: '900', rgba: 'rgba(15,23,42,1)',    hsla: 'hsla(222,47,11,1)',  hex: '#0F172A' },
  { colorClass: 'bg-neutral-950', step: '950', rgba: 'rgba(2,6,23,1)',      hsla: 'hsla(229,84,5,1)',   hex: '#020617' },
]

const SEMANTIC: { label: string; colorClass: string; hex: string }[] = [
  { label: 'accent',          colorClass: 'bg-accent',          hex: '#0054B7' },
  { label: 'accent-hover',    colorClass: 'bg-accent-hover',    hex: '#004698' },
  { label: 'accent-subtle',   colorClass: 'bg-accent-subtle',   hex: '#EDF5FF' },
  { label: 'text-primary',    colorClass: 'bg-text-primary',    hex: '#020617' },
  { label: 'text-secondary',  colorClass: 'bg-text-secondary',  hex: '#334155' },
  { label: 'text-muted',      colorClass: 'bg-text-muted',      hex: '#64748B' },
  { label: 'text-inverse',    colorClass: 'bg-text-inverse',    hex: '#FFFFFF' },
  { label: 'border-default',  colorClass: 'bg-border-default',  hex: '#E2E8F0' },
  { label: 'border-strong',   colorClass: 'bg-border-strong',   hex: '#94A3B8' },
  { label: 'success',         colorClass: 'bg-success',         hex: '#009b65' },
  { label: 'success-subtle',  colorClass: 'bg-success-subtle',  hex: '#ebfef4' },
  { label: 'warning',         colorClass: 'bg-warning',         hex: '#e28500' },
  { label: 'warning-subtle',  colorClass: 'bg-warning-subtle',  hex: '#fffdea' },
  { label: 'danger',          colorClass: 'bg-danger',          hex: '#dc2626' },
  { label: 'danger-subtle',   colorClass: 'bg-danger-subtle',   hex: '#fef2f2' },
  { label: 'info',            colorClass: 'bg-info',            hex: '#0054B7' },
  { label: 'info-subtle',     colorClass: 'bg-info-subtle',     hex: '#EDF5FF' },
]

function Swatch({ colorClass, step, rgba, hsla, hex }: SwatchDef) {
  return (
    <div className="min-w-[72px]">
      <div className={`w-18 h-18 rounded-sm border border-border-default ${colorClass}`} />
      <p className="text-xs text-text-primary mt-sm font-medium">{step}</p>
      {rgba && <p className="text-xs text-text-muted mt-xxss">{rgba}</p>}
      {hsla && <p className="text-xs text-text-muted">{hsla}</p>}
      <p className="text-xs text-text-muted">{hex}</p>
    </div>
  )
}

function SemanticSwatch({ label, colorClass, hex }: { label: string; colorClass: string; hex: string }) {
  return (
    <div className="min-w-[80px]">
      <div className={`w-18 h-18 rounded-sm border border-border-default ${colorClass}`} />
      <p className="text-xs text-text-primary mt-sm font-medium">{label}</p>
      <p className="text-xs text-text-muted">{hex}</p>
    </div>
  )
}

function ColorSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      <div>
        <p className="text-2xl font-bold text-text-primary mb-lg">Primary</p>
        <div className="flex flex-wrap gap-lg">
          {PRIMARY.map((s) => <Swatch key={s.step} {...s} />)}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary mb-lg">Neutrals</p>
        <div className="flex flex-wrap gap-lg">
          {NEUTRAL.map((s) => <Swatch key={s.step} {...s} />)}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary mb-lg">Semantic tokens</p>
        <div className="flex flex-wrap gap-lg">
          {SEMANTIC.map((s) => <SemanticSwatch key={s.label} {...s} />)}
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof ColorSpecimen> = {
  title: 'Foundations/Colors',
  component: ColorSpecimen,
}
export default meta

type Story = StoryObj<typeof ColorSpecimen>
export const AllTokens: Story = {}
