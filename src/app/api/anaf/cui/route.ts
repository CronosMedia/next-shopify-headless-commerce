import { NextRequest, NextResponse } from "next/server"

type AnafRequestItem = { cui: number; data: string }

type AnafResponse = {
  found?: Array<{
    date_generale?: {
      cui?: number
      denumire?: string
      adresa?: string
      nrRegCom?: string
      iban?: string
      statusRO_e_Factura?: boolean
    }
    inregistrare_scop_Tva?: {
      scpTVA?: boolean
      mesaj_ScpTVA?: string
    }
  }>
}

type CacheEntry = {
  expiresAt: number
  payload: Record<string, unknown>
}

const cache = new Map<number, CacheEntry>()
let lastRequestTs = 0
const ONE_SECOND = 1000
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { cui?: string } | null
    const normalizedCui = body?.cui?.replace(/\s+/g, "")

    if (!normalizedCui || !/^\d{2,10}$/.test(normalizedCui)) {
      return NextResponse.json(
        { error: "CUI invalid. Folosește doar cifre." },
        { status: 400 }
      )
    }

    const cuiNumber = Number(normalizedCui)
    const cached = cache.get(cuiNumber)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ...cached.payload, cache: true })
    }

    const payload: AnafRequestItem[] = [
      { cui: cuiNumber, data: new Date().toISOString().slice(0, 10) },
    ]

    const fetchWithRetry = async () => {
      let lastError: unknown
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const now = Date.now()
          const diff = now - lastRequestTs
          if (diff < ONE_SECOND) {
            await new Promise((resolve) => setTimeout(resolve, ONE_SECOND - diff))
          }
          lastRequestTs = Date.now()

          const response = await fetch("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(6000),
          })

          if (response.ok) return response
          lastError = new Error(`HTTP ${response.status}`)
        } catch (error) {
          lastError = error
        }

        await new Promise((resolve) => setTimeout(resolve, 350))
      }

      throw lastError
    }

    try {
      const anafResponse = await fetchWithRetry()
      const data = (await anafResponse.json()) as AnafResponse
      const details = data.found?.[0]?.date_generale
      const status = data.found?.[0]?.inregistrare_scop_Tva

      if (!details) {
        return NextResponse.json(
          { error: "CUI negăsit în registru. Completează manual." },
          { status: 404 }
        )
      }

      const result = {
        cui: details.cui,
        denumire: details.denumire,
        adresa: details.adresa,
        nrRegCom: details.nrRegCom,
        iban: details.iban,
        statusRO_e_Factura: details.statusRO_e_Factura,
        tvaMessage: status?.mesaj_ScpTVA,
        platitorTva: status?.scpTVA ?? null,
        source: "anaf-v9",
      }

      cache.set(cuiNumber, {
        expiresAt: Date.now() + TWENTY_FOUR_HOURS,
        payload: result,
      })

      return NextResponse.json(result)
    } catch {
      const fallbackResponse = await fetch(
        `https://lista-firme.info/api/v1/info?cui=${cuiNumber}`,
        {
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(4000),
        }
      )
      const fallbackData = await fallbackResponse.json().catch(() => null)

      if (!fallbackResponse.ok || !fallbackData) {
        return NextResponse.json(
          { error: "Serviciul ANAF nu răspunde momentan. Încearcă din nou." },
          { status: 502 }
        )
      }

      const result = {
        cui: cuiNumber,
        denumire: fallbackData.denumire || fallbackData.nume || fallbackData.denumire_firma,
        adresa: fallbackData.adresa || fallbackData.adress,
        nrRegCom: fallbackData.nrRegCom || fallbackData.nr_inmatriculare,
        iban: fallbackData.iban || "",
        statusRO_e_Factura: fallbackData.statusRO_e_Factura ?? undefined,
        tvaMessage: fallbackData.tvaMessage || "",
        platitorTva: fallbackData.platitorTva ?? null,
        source: "lista-firme.info",
      }

      cache.set(cuiNumber, {
        expiresAt: Date.now() + TWENTY_FOUR_HOURS,
        payload: result,
      })

      return NextResponse.json(result)
    }
  } catch {
    return NextResponse.json(
      { error: "Eroare internă. Încearcă din nou." },
      { status: 500 }
    )
  }
}
