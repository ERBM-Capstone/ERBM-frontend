interface ListResponse<T> {
  data?: T[];
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

/** Fetch every page for client-side project member and active-advance filters. */
export async function fetchAllPages<T>(
  path: string,
  filters: URLSearchParams,
  token: string,
  signal: AbortSignal,
): Promise<T[]> {
  const pageSize = 100;
  const items: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const params = new URLSearchParams(filters);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    const response = await fetch(`${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const result = await response.json().catch(() => {
      throw new Error("ระบบส่งข้อมูลกลับมาไม่ถูกต้อง กรุณาลองอีกครั้ง");
    }) as ListResponse<T>;

    if (!response.ok) throw new Error(result.message ?? "โหลดข้อมูลไม่สำเร็จ");
    if (!Array.isArray(result.data)) throw new Error("รูปแบบรายการไม่ถูกต้อง กรุณาลองอีกครั้ง");

    items.push(...result.data);
    const reportedTotal = result.meta?.total;
    if (Number.isFinite(reportedTotal)) total = reportedTotal as number;
    else if (result.data.length < pageSize) total = items.length;

    if (result.data.length === 0) break;
    page += 1;
  }

  return items;
}
