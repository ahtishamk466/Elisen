import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MultiSelect } from './MultiSelect'
const meta = { title: 'UI/MultiSelect', component: MultiSelect } satisfies Meta<typeof MultiSelect>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  args: { id: 'default-records', value: [], onChange: () => {}, options: [{value:'a',label:'23.1 · IR',hint:'Applicability.'}] },
}
export const LargeLibrary: Story = {
  args: { id: 'large-records', value: [], onChange: () => {}, options: [] },
  render: function LargeLibraryStory(args) {
    const [value, setValue] = useState<string[]>([])
    return <MultiSelect {...args} virtualized value={value} onChange={setValue}
      options={Array.from({length:4000},(_,i)=>({value:String(i),label:`Section ${i} · ${i===0?'No amendment recorded':'IR'}`,hint:'Existing exact-version record',disabled:i===1,disabledReason:'Already in this basis'}))} />
  },
}
export const Disabled: Story = { args: {...Default.args, disabled:true} }
export const Error: Story = { args: {...Default.args, error:true} }
