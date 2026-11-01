import { useNavigate } from 'react-router-dom'
import { CirclePlay } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** "Watch Walkthrough" in an area's page header: opens that area's narrated walkthrough. */
export function WalkthroughButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return <Button variant="secondary" leadingIcon={<CirclePlay size={16} />} onClick={() => navigate(to)}>Watch Walkthrough</Button>
}
