"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Product, ProductFilters, PaginatedResponse } from "@/lib/api-client";
import { MOCK_PRODUCTS } from "@/lib/mock-products";

export function useProducts(filters: ProductFilters = {}) {
  const { page = 1, search = "", category = "", sort = "latest", per_page = 12 } = filters;

  return useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", { page, search, category, sort, per_page }],
    queryFn: async () => {
      try {
        return await api.store.getProducts(filters);
      } catch (err) {
        // Development fallback: Client-side filtering over mock dataset
        let filtered = [...MOCK_PRODUCTS];

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              p.sku.toLowerCase().includes(s) ||
              p.category.toLowerCase().includes(s)
          );
        }

        if (category && category !== "All") {
          filtered = filtered.filter((p) => p.category === category);
        }

        if (sort === "price_asc") {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sort === "price_desc") {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sort === "name_asc") {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        const total = filtered.length;
        const last_page = Math.ceil(total / per_page) || 1;
        const start = (page - 1) * per_page;
        const pagedData = filtered.slice(start, start + per_page);

        return {
          data: pagedData,
          meta: {
            current_page: page,
            last_page,
            per_page,
            total,
          },
        };
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes as required by prompt 3
  });
}

export function useProduct(idOrSku: string | number) {
  return useQuery<Product>({
    queryKey: ["product", idOrSku],
    queryFn: async () => {
      try {
        const res = await api.store.getProduct(idOrSku);
        return res.data;
      } catch (err) {
        // Fallback to mock item
        const found = MOCK_PRODUCTS.find(
          (p) => String(p.id) === String(idOrSku) || p.sku === String(idOrSku)
        );
        if (found) return found;
        throw new Error("Product not found");
      }
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!idOrSku,
  });
}
