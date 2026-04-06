import ScrollReveal from '../common/ScrollReveal'

interface Props {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <ScrollReveal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && <p className="text-base-content/60 mt-1">{description}</p>}
        </div>
        {action}
      </div>
    </ScrollReveal>
  )
}
