import { createFileRoute } from '@tanstack/react-router'
import { Download } from '../../screens/Download.tsx'

export const Route = createFileRoute('/_portal/export')({ component: Download })
