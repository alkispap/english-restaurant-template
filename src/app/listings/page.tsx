import { redirect } from "next/navigation";

type ListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ListingsPageRedirect({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const query = toSearchParams(params).toString();
  redirect(query ? `/?${query}` : "/");
}

function toSearchParams(params: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => searchParams.append(key, item));
    } else if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}
