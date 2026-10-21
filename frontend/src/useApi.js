import { useEffect, useState } from 'react'

// Завантажує дані при монтуванні та зміні deps, скасовує запит при розмонтуванні.
// fetcher отримує AbortSignal і повертає проміс. Результат позначаємо ключем deps,
// тож поки відповідь для нових deps не прийшла, loading = true без скидання стану в effect.
export function useApi(fetcher, deps) {
  const key = JSON.stringify(deps)
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null })
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error })
      },
    )

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = result.key !== key
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
  }
}
