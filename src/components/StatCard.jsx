export default function StatCard({ label, value, unit, note, className = '' }) {
  return (
    <div className={`kpi-card ${className}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        {unit && <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">{unit}</span>}
      </p>
      {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{note}</p>}
    </div>
  );
}
