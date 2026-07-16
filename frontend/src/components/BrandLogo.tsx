type BrandLogoProps = {
  className?: string
  inverse?: boolean
  showName?: boolean
}

export function BrandLogo({ className = '', inverse = false, showName = true }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        alt=""
        aria-hidden="true"
        className="size-10 shrink-0"
        height="40"
        src={inverse ? '/brand/vetanflow-mark-inverse.svg' : '/brand/vetanflow-mark.svg'}
        width="40"
      />
      {showName ? <span className="text-sm font-semibold">VetanFlow</span> : null}
    </span>
  )
}
