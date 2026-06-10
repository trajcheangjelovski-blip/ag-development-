'use client'

import React from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { BUILD_PACKAGES, CARE_PLANS } from './_data'

export type BuildPkg = (typeof BUILD_PACKAGES)[0] | undefined
export type CarePlan = (typeof CARE_PLANS)[0]

// ── RadioDot ──────────────────────────────────────────────────────────────────

export function RadioDot({ on }: { on: boolean }) {
  return (
    <div className={clsx(
      'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 transition-all duration-150',
      on ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white',
    )} />
  )
}

// ── InfoBox ───────────────────────────────────────────────────────────────────

const INFO_VARIANTS = {
  blue:  'bg-blue-50 border border-blue-200 text-blue-800',
  green: 'bg-green-50 border border-green-200 text-green-800',
  amber: 'bg-amber-50 border border-amber-200 text-amber-800',
  red:   'bg-red-50 border border-red-200 text-red-600',
}

export function InfoBox({ type, children }: {
  type: keyof typeof INFO_VARIANTS
  children: React.ReactNode
}) {
  return (
    <div className={clsx('rounded-[10px] px-4 py-3 text-[13px] leading-relaxed', INFO_VARIANTS[type])}>
      {children}
    </div>
  )
}

// ── StepBar ───────────────────────────────────────────────────────────────────

export function StepBar({ step, skipped }: { step: number; skipped?: boolean }) {
  if (skipped && step === 3) {
    return (
      <div className="flex items-start justify-center mb-10">
        {(['Website Package', 'Your Details'] as const).map((label, i) => (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-2 min-w-9 md:min-w-[100px]">
              <div className={clsx(
                'w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold',
                i === 0 ? 'bg-[#0f1f3d] text-white' : 'bg-blue-600 text-white',
              )}>
                {i === 0 ? '✓' : '2'}
              </div>
              <span className={clsx(
                'hidden md:block text-[11px] text-center whitespace-nowrap leading-tight',
                i === 1 ? 'font-bold text-[#0f1f3d]' : 'font-normal text-slate-400',
              )}>
                {label}
              </span>
            </div>
            {i === 0 && (
              <div className="w-5 md:w-11 h-0.5 bg-[#0f1f3d] mt-[17px] mx-1.5 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    )
  }

  const labels = ['Website Package', 'Care Plan', 'Your Details']
  return (
    <div className="flex items-start justify-center mb-10">
      {labels.map((label, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-2 min-w-9 md:min-w-[100px]">
              <div className={clsx(
                'w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold transition-all duration-200',
                done ? 'bg-[#0f1f3d] text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400',
              )}>
                {done ? '✓' : num}
              </div>
              <span className={clsx(
                'hidden md:block text-[11px] text-center whitespace-nowrap leading-tight',
                active ? 'font-bold text-[#0f1f3d]' : 'font-normal text-slate-400',
              )}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={clsx(
                'w-5 md:w-11 h-0.5 mt-[17px] mx-1.5 flex-shrink-0 transition-colors duration-200',
                num < step ? 'bg-[#0f1f3d]' : 'bg-slate-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── SummaryCard ───────────────────────────────────────────────────────────────

export function SummaryCard({ build, care, isCustom }: {
  build: BuildPkg
  care: CarePlan
  isCustom: boolean
}) {
  const oneTime = build?.price ?? 0
  const monthly = care.price

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h3 className="text-[15px] font-bold text-[#0f1f3d] m-0 mb-4 pb-3 border-b border-slate-100">
        Order Summary
      </h3>

      <div className="mb-3.5 pb-3.5 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 m-0 mb-2">
          Website Build — One-time
        </p>
        {isCustom ? (
          <div className="text-sm font-semibold text-[#0f1f3d]">Custom Quote (after review)</div>
        ) : build ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-600">{build.name}</span>
              <span className="text-[15px] font-bold text-[#0f1f3d]">${build.price}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              was <span className="line-through">${build.originalPrice}</span> — Save ${build.originalPrice - build.price}
            </div>
          </>
        ) : (
          <div className="text-[13px] text-slate-400 italic">No package selected</div>
        )}
      </div>

      <div className="mb-3.5 pb-3.5 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 m-0 mb-2">
          Monthly Care
        </p>
        {care.id !== 'none' ? (
          <>
            <div className="flex justify-between py-1">
              <span className="text-[13px] text-slate-600">{care.name}</span>
              <span className="text-[13px] font-semibold text-[#0f1f3d]">${care.price}/mo</span>
            </div>
            <div className="text-[11px] text-green-600 font-semibold">✓ Hosting included</div>
          </>
        ) : (
          <div className="text-[13px] text-slate-400 italic">None selected</div>
        )}
      </div>

      <div className="mb-4">
        {!isCustom && (
          <div className="flex justify-between py-1.5">
            <span className="text-sm font-semibold text-gray-700">One-time total</span>
            <span className="text-[17px] font-bold text-[#0f1f3d]">${oneTime}</span>
          </div>
        )}
        {monthly > 0 && (
          <div className="flex justify-between py-1.5">
            <span className="text-sm font-semibold text-gray-700">Monthly total</span>
            <span className="text-[17px] font-bold text-blue-600">${monthly}/mo</span>
          </div>
        )}
        {care.id === 'none' && (
          <div className="mt-2">
            <InfoBox type="amber">⚠️ No hosting included — arrange hosting separately</InfoBox>
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
          Domain name not included (~$12/year, purchased separately)
        </p>
      </div>

      <InfoBox type="blue">
        🔒 <strong>No payment today.</strong> We&apos;ll contact you within 1 business day to confirm details.
      </InfoBox>

      <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-[10px]">
        <div className="text-xs font-semibold text-[#0f1f3d] mb-2">
          💡 Need IT support or social media design?
        </div>
        <div className="text-[11px] text-slate-500 leading-relaxed mb-2">
          You can order these separately after your website is set up.
        </div>
        <div className="flex flex-col gap-1">
          <a href="/order/it-support" className="text-xs font-semibold text-blue-600 no-underline">→ View IT Support plans</a>
          <a href="/order/social-media" className="text-xs font-semibold text-violet-600 no-underline">→ View Social Media plans</a>
        </div>
      </div>
    </div>
  )
}
