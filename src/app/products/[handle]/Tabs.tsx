'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'

const reviewsList = [
  {
    id: 1,
    author: 'Maria G.',
    avatarColor: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    rating: 5,
    date: 'acum o săptămână',
    content: 'Calitatea finisajelor este peste așteptări. O adevărată capodoperă minimalistă care funcționează la fel de bine pe cât arată.',
    verified: true
  },
  {
    id: 2,
    author: 'Andrei K.',
    avatarColor: 'bg-blue-50 text-blue-700 border border-blue-100',
    rating: 5,
    date: 'acum 3 săptămâni',
    content: 'O măiestrie excepțională. Livrarea a fost rapidă, iar ambalajul reflectă pe deplin caracterul premium al brandului.',
    verified: true
  },
  {
    id: 3,
    author: 'Elena R.',
    avatarColor: 'bg-amber-50 text-amber-700 border border-amber-100',
    rating: 5,
    date: 'acum o lună',
    content: 'Sistemul de filtrare este extrem de eficient. Debitul de apă este excelent, iar gustul apei este perfect curat. Recomand cu încredere.',
    verified: true
  }
]

export default function Tabs({
  descriptionHtml,
}: {
  descriptionHtml: string
  details?: { label: string; value: string }[]
}) {
  const [activeTab, setActiveTab] = useState<'descriere' | 'specificatii' | 'livrare' | 'recenzii'>('descriere')

  const tabs = [
    { id: 'descriere' as const, label: 'Descriere' },
    { id: 'specificatii' as const, label: 'Specificații' },
    { id: 'livrare' as const, label: 'Livrare & Retur' },
    { id: 'recenzii' as const, label: 'Recenzii' },
  ]

  return (
    <div className="w-full">
      {/* Horizontal Tabs Selection */}
      <div className="flex border-b border-[#f0efed] overflow-x-auto scrollbar-none gap-8 md:gap-16 mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                setActiveTab(tab.id)
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center',
                  block: 'nearest',
                })
              }}
              className={`pb-4 text-[13px] md:text-[15px] font-medium uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'border-black text-[#1a1a1a]'
                  : 'border-transparent text-neutral-400 hover:text-[#1a1a1a]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[250px] transition-all duration-300 ease-in-out">
        {/* Description Tab */}
        {activeTab === 'descriere' && (
          <div
            className="text-[15px] md:text-base font-normal leading-[1.8] text-[#4a4a4a] prose-strong:font-semibold prose-strong:text-[#1a1a1a] max-w-3xl animate-fadeIn"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}

        {/* Specifications Tab */}
        {activeTab === 'specificatii' && (
          <div className="max-w-xl divide-y divide-[#f0efed] animate-fadeIn">
            {[
              { label: 'Execuție', value: 'Lucrat manual în serii limitate' },
              { label: 'Sustenabilitate', value: '100% materiale de bază reciclate' },
              { label: 'Garanție', value: 'Garanție limitată de 2 ani de la producător' }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-4 gap-6">
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 shrink-0">
                  {item.label}
                </span>
                <span className="text-[15px] md:text-base font-light text-[#1a1a1a] text-right leading-relaxed">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'livrare' && (
          <div className="text-[14px] md:text-[15px] font-normal leading-relaxed text-[#4a4a4a] space-y-4 max-w-2xl animate-fadeIn">
            <p>
              Livrarea standard (2-4 zile lucrătoare) este gratuită pentru toate comenzile
              care depășesc suma de 500 RON.
            </p>
            <p>
              Returul poate fi inițiat în termen de 30 de zile de la primirea coletului. Toate produsele
              trebuie să fie returnate în starea lor originală.
            </p>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'recenzii' && (
          <div className="space-y-12 animate-fadeIn max-w-3xl">
            {/* Summary Widget - Google style */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#F9F8F6] p-6 md:p-8 rounded-none border border-[#e5e4e0]">
              {/* Left side: Rating score */}
              <div className="md:col-span-4 text-center md:border-r md:border-[#e5e4e0] md:pr-8 flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1a1a1a]">4.8</span>
                <div className="flex gap-1 my-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] md:text-xs text-neutral-500 uppercase tracking-[0.15em]">
                  Bazat pe 12 recenzii
                </span>
              </div>

              {/* Right side: Star percentage bars */}
              <div className="md:col-span-8 space-y-2.5">
                {[
                  { stars: 5, count: 10, percentage: 83 },
                  { stars: 4, count: 2, percentage: 17 },
                  { stars: 3, count: 0, percentage: 0 },
                  { stars: 2, count: 0, percentage: 0 },
                  { stars: 1, count: 0, percentage: 0 },
                ].map((row) => (
                  <div key={row.stars} className="flex items-center gap-4 text-xs md:text-sm">
                    <span className="w-3 text-[#1a1a1a] font-medium">{row.stars}</span>
                    <Star size={12} className="fill-neutral-400 text-neutral-400" />
                    <div className="flex-1 h-2 bg-[#f0efed] rounded-none overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-neutral-400 font-[family:var(--font-geist-mono)]">{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Reviews List */}
            <div className="space-y-8 divide-y divide-[#f0efed]">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="pt-8 first:pt-0 space-y-4">
                  {/* Reviewer Meta info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div className={`w-9 h-9 rounded-full ${rev.avatarColor} flex items-center justify-center font-medium text-sm select-none`}>
                        {rev.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1a1a1a] tracking-wide">
                          {rev.author}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {rev.date}
                        </div>
                      </div>
                    </div>

                    {/* Verification badge & Stars */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= Math.floor(rev.rating);
                          const isHalf = !isFilled && star - 0.5 <= rev.rating;
                          return (
                            <Star
                              key={star}
                              size={13}
                              className={
                                isFilled
                                  ? 'fill-amber-400 text-amber-400'
                                  : isHalf
                                  ? 'fill-amber-400 text-amber-400 opacity-50'
                                  : 'text-neutral-200'
                              }
                            />
                          );
                        })}
                      </div>
                      {rev.verified && (
                        <span className="text-[9px] font-semibold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 uppercase border border-emerald-100">
                          Achiziție Verificată
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-[14px] md:text-[15px] font-light leading-relaxed text-[#4a4a4a] pl-12">
                    &ldquo;{rev.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
