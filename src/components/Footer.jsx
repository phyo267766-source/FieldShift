export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          <p>FieldShift | Adapting farms with NASA data.</p>
          <div className="flex items-center gap-4">
            <span>NASA Space Apps Challenge 2026</span>
            <span>•</span>
            <span>Illustrative data, not live NASA observations.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
