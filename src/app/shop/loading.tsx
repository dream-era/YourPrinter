export default function Loading() {
  return (
    <div className="w-full h-screen min-h-[100dvh] bg-white flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 border-4 border-orange-100 rounded-full"></div>
        <div className="absolute w-20 h-20 border-4 border-[#FF6B57] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-extrabold text-[#FF6B57] text-xs tracking-wider">SHOP</span>
      </div>
      <p className="text-slate-500 font-medium mt-6 animate-pulse">Loading Shop Dashboard...</p>
    </div>
  );
}
