import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { createCategory, deleteCategory } from "../actions";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await db.category.findMany({
    where: { userId: user.id },
    include: { _count: { select: { transactions: true, budgets: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page">
      <h2>Categories</h2>
      <p className="subtitle">Organize and group your income and spending streams.</p>

      <form action={createCategory} className="card form-grid mt-6">
        <label>
          Category name
          <input required name="name" placeholder="e.g. Groceries, Utilities, Salary" />
        </label>
        <label>
          Badge color
          <input name="color" type="color" defaultValue="#0f766e" />
        </label>
        <button className="button">Add category</button>
      </form>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Categories list ({categories.length})</h3>
        {categories.length === 0 ? (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-slate-500">No categories added yet. Add your first category above.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((category) => (
              <div className="card flex items-center justify-between gap-3" key={category.id}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  <div className="truncate">
                    <p className="font-medium text-slate-900 truncate">{category.name}</p>
                    <p className="text-xs text-slate-400">
                      {category._count.transactions} transactions
                    </p>
                  </div>
                </div>
                {category._count.budgets === 0 && (
                  <form action={deleteCategory}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
