export default function Loading() {
  return (
    <div className="w-full h-screen min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute w-20 h-20 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-extrabold text-blue-600 text-xs tracking-wider">YP</span>
      </div>
      <p className="text-slate-500 font-medium mt-6 animate-pulse">Loading YourPrinter...</p>
    </div>
  );
}
