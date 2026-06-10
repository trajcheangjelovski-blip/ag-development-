interface OrderSummaryProps {
  buildName: string
  buildSalePrice: number
  buildOriginalPrice: number
  buildDiscount: string
  careName: string
  carePrice: number
  itName: string
  itPrice: number
  designName: string
  designPrice: number
  isCustom?: boolean
  compact?: boolean
}

export function OrderSummary({
  buildName, buildSalePrice, buildOriginalPrice, buildDiscount,
  careName, carePrice, itName, itPrice, designName, designPrice,
  isCustom, compact,
}: OrderSummaryProps) {
  const oneTimeTotal = isCustom ? 0 : buildSalePrice
  const monthlyTotal = carePrice + itPrice + designPrice
  const hasMonthly = monthlyTotal > 0
  const hasCare = carePrice > 0
  const hasIT = itPrice > 0
  const hasDesign = designPrice > 0

  const row = (label: string, value: string, sub?: string) => (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</div>
        {sub && <div className={`text-emerald-600 font-semibold ${compact ? 'text-[10px]' : 'text-xs'} mt-0.5`}>{sub}</div>}
      </div>
      <div className={`font-bold text-slate-800 whitespace-nowrap ${compact ? 'text-xs' : 'text-sm'}`}>{value}</div>
    </div>
  )

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${compact ? '' : 'shadow-sm'}`}>
      <div className={`px-5 py-3 font-display font-bold text-slate-800 border-b border-slate-100 ${compact ? 'text-sm' : 'text-base'}`}>
        Your Order Summary
      </div>

      {/* Build */}
      {!isCustom && buildName && (
        <div className={`px-5 ${compact ? 'py-3' : 'py-4'} border-b border-slate-100`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2`}>Website Build — One-time</div>
          {row(buildName, `$${buildSalePrice}`)}
          <div className={`text-slate-400 mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span style={{ textDecoration: 'line-through' }}>${buildOriginalPrice}</span>
            {' '}— {buildDiscount}
          </div>
        </div>
      )}
      {isCustom && (
        <div className={`px-5 ${compact ? 'py-3' : 'py-4'} border-b border-slate-100`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Website Build — One-time</div>
          <div className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>Custom Quote</div>
          <div className={`text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'} mt-0.5`}>Quoted after review</div>
        </div>
      )}

      {/* Monthly */}
      {hasMonthly && (
        <div className={`px-5 ${compact ? 'py-3' : 'py-4'} border-b border-slate-100 space-y-2`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Monthly</div>
          {hasCare && row(careName, `$${carePrice}/mo`, 'Hosting included ✓')}
          {hasIT && row(itName, `+$${itPrice}/mo`)}
          {hasDesign && row(designName, `+$${designPrice}/mo`)}
        </div>
      )}

      {!hasMonthly && (
        <div className={`px-5 ${compact ? 'py-3' : 'py-4'} border-b border-slate-100`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monthly</div>
          <div className={`text-slate-400 italic ${compact ? 'text-[10px]' : 'text-xs'}`}>No monthly plan selected</div>
          <div className={`text-amber-600 ${compact ? 'text-[10px]' : 'text-xs'} mt-1`}>⚠️ You'll need to arrange hosting separately</div>
        </div>
      )}

      {/* Totals */}
      <div className={`px-5 ${compact ? 'py-3' : 'py-4'} bg-slate-50 space-y-2`}>
        {!isCustom && (
          <div className="flex justify-between items-center">
            <span className={`font-bold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>One-time total</span>
            <span className={`font-extrabold text-slate-800 ${compact ? 'text-sm' : 'text-base'}`}>${oneTimeTotal}</span>
          </div>
        )}
        {hasMonthly && (
          <div className="flex justify-between items-center">
            <span className={`font-bold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>Monthly total</span>
            <span className={`font-extrabold text-blue-600 ${compact ? 'text-sm' : 'text-base'}`}>${monthlyTotal}/mo</span>
          </div>
        )}
        <div className={`text-slate-400 pt-1 border-t border-slate-200 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Domain name not included (~$12/year, purchased separately)
        </div>
      </div>

      {!compact && (
        <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>No payment today.</strong> We&apos;ll review your order and contact you within 1 business day to confirm details and arrange payment.
          </p>
        </div>
      )}
    </div>
  )
}
