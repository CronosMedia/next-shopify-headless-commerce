'use client'
import { useState } from 'react'

export default function Tabs({
  descriptionHtml,
  details,
}: {
  descriptionHtml: string
  details?: { label: string; value: string }[]
}) {
  const [tab, setTab] = useState<'description' | 'specifications' | 'shipping' | 'reviews'>('description')
  return (
    <div className="space-y-3">
      <div className="flex gap-6 border-b">
        <button
          className={`py-2 border-b-2 -mb-px ${
            tab === 'description' ? 'border-black' : 'border-transparent'
          }`}
          onClick={() => setTab('description')}
        >
          Descriere
        </button>
        <button
          className={`py-2 border-b-2 -mb-px ${
            tab === 'specifications' ? 'border-black' : 'border-transparent'
          }`}
          onClick={() => setTab('specifications')}
        >
          Specificații
        </button>
        <button
          className={`py-2 border-b-2 -mb-px ${
            tab === 'shipping' ? 'border-black' : 'border-transparent'
          }`}
          onClick={() => setTab('shipping')}
        >
          Livrare și Retur
        </button>
        <button
          className={`py-2 border-b-2 -mb-px ${
            tab === 'reviews' ? 'border-black' : 'border-transparent'
          }`}
          onClick={() => setTab('reviews')}
        >
          Recenzii
        </button>
      </div>
      {tab === 'description' ? (
        <div
          className="prose prose-sm"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : tab === 'specifications' ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details?.map((d) => (
            <div key={d.label} className="flex gap-3">
              <dt className="w-28 text-gray-600">{d.label}</dt>
              <dd className="flex-1">{d.value}</dd>
            </div>
          )) || <div>Nu există specificații.</div>}
        </dl>
      ) : tab === 'shipping' ? (
        <div className="prose prose-sm">
          <h3>Livrare</h3>
          <p>Comenzile sunt procesate în 1-2 zile lucrătoare. Livrarea standard durează 3-5 zile lucrătoare.</p>
          <h3>Retururi</h3>
          <p>Acceptăm retururi în termen de 30 de zile de la primirea comenzii, cu condiția ca produsele să fie în starea originală.</p>
        </div>
      ) : tab === 'reviews' ? (
        <div className="prose prose-sm">
          <p>Momentan nu există recenzii pentru acest produs. Fii primul care lasă o recenzie!</p>
        </div>
      ) : null}
    </div>
  )
}