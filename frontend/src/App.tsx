import { useState, useEffect, useCallback } from "react";
import "./App.css"
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  createdAt: string;
}

interface ApiResponse {
  products: Product[];
  nextCursor: string | null;
  hasMore: boolean;
}

const API_BASE = "http://localhost:3000";
const LIMIT = 20;
const CATEGORIES = ["all", "electronics", "fashion", "books", "home", "sports", "beauty", "toys"];
const CATEGORY_COLORS: Record<string, string> = {
  electronics: "#6366f1",
  fashion:     "#ec4899",
  books:       "#f59e0b",
  home:        "#10b981",
  sports:      "#3b82f6",
  beauty:      "#a855f7",
  toys:        "#ef4444",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function App() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [cursor, setCursor]           = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [category, setCategory]       = useState("all");
  const [error, setError]             = useState<string | null>(null);

  const fetchProducts = useCallback(async (cat: string, cur: string | null, reset: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT) });
      if (cat !== "all") params.set("category", cat);
      if (cur) params.set("cursor", cur);

      const res = await fetch(`${API_BASE}/products?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: ApiResponse = await res.json();
      setProducts(prev => reset ? data.products : [...prev, ...data.products]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch products");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    setInitialLoad(true);
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    fetchProducts(category, null, true);
  }, [category, fetchProducts]);

  const loadMore = () => {
    if (!loading && hasMore && cursor) {
      fetchProducts(category, cursor, false);
    }
  };

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.logo}>Nexlify</h1>
            <p style={styles.tagline}>200,000 products · cursor-paginated</p>
          </div>
          <span style={styles.pill}>{products.length.toLocaleString()} loaded</span>
        </div>
      </header>

      <div style={styles.filterBar}>
        <div style={styles.filterInner}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                ...styles.filterBtn,
                ...(category === cat ? styles.filterBtnActive : {}),
                ...(cat !== "all" && category === cat
                  ? { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }
                  : {}),
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main style={styles.main}>
        {error && (
          <div style={styles.error}>
            ⚠️ {error} — make sure your backend is running on port 3000.
          </div>
        )}

        {initialLoad && !error && (
          <div style={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        )}

        {!initialLoad && products.length > 0 && (
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: (CATEGORY_COLORS[p.category] ?? "#64748b") + "22",
                    color: CATEGORY_COLORS[p.category] ?? "#64748b",
                  }}>
                    {p.category}
                  </span>
                  <span style={styles.date}>{formatDate(p.createdAt)}</span>
                </div>
                <p style={styles.productName}>{p.name}</p>
                <span style={styles.price}>{formatPrice(p.price)}</span>
              </div>
            ))}
          </div>
        )}

        {!initialLoad && !loading && products.length === 0 && !error && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No products found</p>
            <p style={styles.emptyText}>Try a different category.</p>
          </div>
        )}

        {!initialLoad && hasMore && !error && (
          <div style={styles.loadMoreWrap}>
            <button
              onClick={loadMore}
              disabled={loading}
              style={{ ...styles.loadMoreBtn, ...(loading ? styles.loadMoreBtnDisabled : {}) }}
            >
              {loading ? "Loading..." : "Load more products"}
            </button>
            {cursor && <p style={styles.cursorText}>cursor: {cursor.slice(0, 24)}…</p>}
          </div>
        )}

        {!initialLoad && !hasMore && products.length > 0 && (
          <div style={styles.endMessage}>
            ✓ All {products.length.toLocaleString()} products loaded
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root:               { minHeight: "100vh", backgroundColor: "#0f0f11", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" },
  header:             { borderBottom: "1px solid #1e1e2e", backgroundColor: "#0f0f11", position: "sticky", top: 0, zIndex: 10 },
  headerInner:        { maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:               { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  tagline:            { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  pill:               { fontSize: 12, color: "#818cf8", backgroundColor: "#818cf811", border: "1px solid #818cf822", borderRadius: 20, padding: "4px 12px" },
  filterBar:          { borderBottom: "1px solid #1e1e2e", backgroundColor: "#0d0d10", overflowX: "auto" },
  filterInner:        { maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 8 },
  filterBtn:          { padding: "6px 16px", borderRadius: 20, border: "1px solid #2a2a3a", backgroundColor: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  filterBtnActive:    { backgroundColor: "#818cf8", borderColor: "#818cf8", color: "#fff" },
  main:               { maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" },
  grid:               { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card:               { backgroundColor: "#16161e", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 },
  cardTop:            { display: "flex", justifyContent: "space-between", alignItems: "center" },
  categoryBadge:      { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" },
  date:               { fontSize: 11, color: "#475569" },
  productName:        { margin: 0, fontSize: 14, fontWeight: 500, color: "#cbd5e1", lineHeight: 1.4 },
  price:              { fontSize: 18, fontWeight: 700, color: "#e2e8f0" },
  skeleton:           { backgroundColor: "#16161e", border: "1px solid #1e1e2e", borderRadius: 12, height: 130 },
  error:              { backgroundColor: "#ef444411", border: "1px solid #ef444433", borderRadius: 10, padding: "16px 20px", color: "#fca5a5", fontSize: 14, marginBottom: 24 },
  empty:              { textAlign: "center", padding: "80px 24px" },
  emptyTitle:         { fontSize: 18, fontWeight: 600, color: "#475569", margin: "0 0 8px" },
  emptyText:          { fontSize: 14, color: "#334155", margin: 0 },
  loadMoreWrap:       { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 40 },
  loadMoreBtn:        { padding: "12px 32px", borderRadius: 8, border: "none", backgroundColor: "#818cf8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  loadMoreBtnDisabled:{ opacity: 0.5, cursor: "not-allowed" },
  cursorText:         { fontSize: 11, color: "#334155", fontFamily: "monospace", margin: 0 },
  endMessage:         { textAlign: "center", marginTop: 40, color: "#334155", fontSize: 13 },
};